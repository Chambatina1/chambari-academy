import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIRS = [
  path.join(process.cwd(), 'upload'),
  path.join(process.cwd(), 'uploads'),
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Prevent directory traversal
    const safeFilename = path.basename(filename);

    let fileBuffer: Buffer | null = null;
    for (const dir of UPLOAD_DIRS) {
      try {
        const filePath = path.join(dir, safeFilename);
        fileBuffer = await fs.readFile(filePath);
        break;
      } catch {
        // try next directory
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    // Determine content type
    const ext = safeFilename.split('.').pop()?.toLowerCase() || '';
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      txt: 'text/plain',
      csv: 'text/csv',
      html: 'text/html',
      htlm: 'text/html',
      htm: 'text/html',
      zip: 'application/zip',
      rar: 'application/vnd.rar',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }
}
