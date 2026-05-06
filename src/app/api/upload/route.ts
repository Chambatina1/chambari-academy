import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mp3',
  'txt', 'csv', 'zip', 'rar',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (base64 will be ~13MB)

const MIME_TYPES: Record<string, string> = {
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
  zip: 'application/zip',
  rar: 'application/vnd.rar',
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo es demasiado grande (máximo 10MB)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
    }

    // Convert file to base64 data URL (stored in DB, survives deploys)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
      filename: file.name,
      originalName: file.name,
      size: file.size,
      mimeType,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
  }
}
