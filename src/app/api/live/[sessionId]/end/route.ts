import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await db.liveSession.update({
      where: { id: sessionId },
      data: { isActive: false, updatedAt: new Date() },
    });

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Live session end error:', error);
    return NextResponse.json({ error: 'Error al finalizar sesión' }, { status: 500 });
  }
}
