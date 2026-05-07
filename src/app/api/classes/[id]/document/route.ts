import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cls = await db.class.findUnique({
      where: { id },
      select: { documentUrl: true, documentName: true },
    });

    if (!cls || !cls.documentUrl) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    const docUrl = cls.documentUrl;

    // Old file paths (e.g. /api/files/xxx.pdf) are no longer supported
    if (!docUrl.startsWith('data:')) {
      return NextResponse.json({ error: 'Documento no disponible. Por favor sube el documento de nuevo.' }, { status: 410 });
    }

    // Parse data URL: data:mime/type;base64,xxxxx
    const commaIndex = docUrl.indexOf(',');
    if (commaIndex === -1) {
      return NextResponse.json({ error: 'Formato de documento inválido' }, { status: 400 });
    }

    const headerPart = docUrl.substring(0, commaIndex);
    const base64Data = docUrl.substring(commaIndex + 1);

    // Extract mime type from "data:mime/type;base64"
    const mimeMatch = headerPart.match(/^data:([^;]+)/);
    if (!mimeMatch) {
      return NextResponse.json({ error: 'Tipo de documento desconocido' }, { status: 400 });
    }

    const mimeType = mimeMatch[1];
    const buffer = Buffer.from(base64Data, 'base64');

    const safeName = cls.documentName || 'document';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(safeName)}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Document serve error:', error);
    return NextResponse.json({ error: 'Error al obtener el documento' }, { status: 500 });
  }
}
