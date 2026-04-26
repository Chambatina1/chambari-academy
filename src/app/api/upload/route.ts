import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'

// Allowed file extensions for documents and media
const ALLOWED_EXTENSIONS = [
  // Documents
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf', 'csv',
  // Images
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico',
  // Video
  'mp4', 'webm', 'avi', 'mov', 'mkv',
  // Audio
  'mp3', 'wav', 'ogg', 'm4a', 'aac',
  // Other
  'json', 'xml', 'html', 'htm',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo excede el límite de 50MB' }, { status: 400 })
    }

    // Validate by file extension (more reliable than MIME type)
    const fileName = file.name || 'archivo'
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ 
        error: `Tipo de archivo no permitido (.${ext || 'desconocido'}). Formatos aceptados: ${ALLOWED_EXTENSIONS.slice(0, 8).join(', ')}, etc.` 
      }, { status: 400 })
    }

    // Also check MIME type for basic validation
    if (file.type && file.type.startsWith('application/x-') || file.type === 'application/octet-stream') {
      // Allow generic binary types as long as extension is valid
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uniqueName = `${crypto.randomUUID()}.${ext}`

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const filePath = join(uploadDir, uniqueName)
    await writeFile(filePath, buffer)

    const url = `/uploads/${uniqueName}`

    return NextResponse.json({ url, name: fileName, size: file.size, type: file.type, ext })
  } catch (error) {
    console.error('Upload error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al subir archivo: ${msg}` }, { status: 500 })
  }
}
