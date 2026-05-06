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

    const dataUrl = cls.documentUrl;

    // If it's a legacy file path (not base64), return redirect
    if (!dataUrl.startsWith('data:')) {
      return NextResponse.json({ redirectUrl: dataUrl });
    }

    // Parse data URL: data:mime/type;base64,xxxxx
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: 'Formato de documento inválido' }, { status: 400 });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const safeName = cls.documentName || 'document';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(safeName)}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Document serve error:', error);
    return NextResponse.json({ error: 'Error al obtener el documento' }, { status: 500 });
  }
}
