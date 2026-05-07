import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

// Search both upload directories for the file
const UPLOAD_DIRS = [
  path.join(process.cwd(), 'upload'),
  path.join(process.cwd(), 'uploads'),
];

async function findFile(filename: string): Promise<Buffer | null> {
  const safeName = path.basename(filename);
  for (const dir of UPLOAD_DIRS) {
    try {
      const filePath = path.join(dir, safeName);
      return await fs.readFile(filePath);
    } catch {
      // try next dir
    }
  }
  return null;
}

const EXT_CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  mp4: 'video/mp4', mp3: 'audio/mpeg',
  txt: 'text/plain', csv: 'text/csv',
  html: 'text/html', htlm: 'text/html', htm: 'text/html',
  zip: 'application/zip', rar: 'application/vnd.rar',
};

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
    const safeName = cls.documentName || 'document';

    // Case 1: data URL stored in DB
    if (docUrl.startsWith('data:')) {
      const commaIndex = docUrl.indexOf(',');
      if (commaIndex === -1) {
        return NextResponse.json({ error: 'Formato de documento inválido' }, { status: 400 });
      }

      const headerPart = docUrl.substring(0, commaIndex);
      const base64Data = docUrl.substring(commaIndex + 1);

      const mimeMatch = headerPart.match(/^data:([^;]+)/);
      if (!mimeMatch) {
        return NextResponse.json({ error: 'Tipo de documento desconocido' }, { status: 400 });
      }

      let mimeType = mimeMatch[1];
      const buffer = Buffer.from(base64Data, 'base64');

      // Override mime type based on filename extension (upload may have stored wrong type)
      const ext = safeName.split('.').pop()?.toLowerCase() || '';
      if (EXT_CONTENT_TYPES[ext]) {
        mimeType = EXT_CONTENT_TYPES[ext];
      } else if (buffer.slice(0, 15).toString('utf-8').trimStart().startsWith('<!DOCTYPE') || buffer.slice(0, 5).toString('utf-8').trimStart().startsWith('<html')) {
        mimeType = 'text/html';
      } else if (buffer.slice(0, 4).toString('utf-8') === '%PDF') {
        mimeType = 'application/pdf';
      }

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
    }

    // Case 2: file path like /api/files/Advervios.htlm or just filename
    let filename = '';
    if (docUrl.startsWith('/api/files/')) {
      filename = docUrl.replace('/api/files/', '');
    } else if (!docUrl.startsWith('http')) {
      // Could be a bare filename or relative path
      filename = path.basename(docUrl);
    }

    if (filename) {
      const buffer = await findFile(filename);
      if (buffer) {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const mimeType = EXT_CONTENT_TYPES[ext] || 'application/octet-stream';

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
      }
    }

    return NextResponse.json({ error: 'Documento no disponible. Por favor sube el documento de nuevo.' }, { status: 410 });
  } catch (error) {
    console.error('Document serve error:', error);
    return NextResponse.json({ error: 'Error al obtener el documento' }, { status: 500 });
  }
}
