import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sseStore } from '@/app/api/live/sse-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { content, type = 'message' } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'El contenido es obligatorio' }, { status: 400 });
    }

    if (!['message', 'highlight', 'alert'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de anotación inválido' }, { status: 400 });
    }

    // Verify session exists and is active
    const session = await db.liveSession.findUnique({ where: { id: sessionId } });
    if (!session || !session.isActive) {
      return NextResponse.json({ error: 'Sesión no encontrada o inactiva' }, { status: 404 });
    }

    // Create annotation
    const annotation = await db.annotation.create({
      data: {
        sessionId,
        content: content.trim(),
        type,
      },
    });

    // Push to SSE listeners
    sseStore.push(sessionId, JSON.stringify(annotation));

    return NextResponse.json({ annotation });
  } catch (error) {
    console.error('Annotation create error:', error);
    return NextResponse.json({ error: 'Error al crear anotación' }, { status: 500 });
  }
}
