import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json().catch(() => ({}));
    const { studentName } = body;

    // Verify session exists and is active
    const session = await db.liveSession.findUnique({ where: { id: sessionId } });
    if (!session || !session.isActive) {
      return NextResponse.json({ error: 'Sesión no encontrada o inactiva' }, { status: 404 });
    }

    // Simple heartbeat - in a production system this would track presence
    return NextResponse.json({
      success: true,
      sessionId,
      studentName: studentName || 'anonymous',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ error: 'Error en heartbeat' }, { status: 500 });
  }
}
