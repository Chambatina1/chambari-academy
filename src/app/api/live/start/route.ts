import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json({ error: 'classId es obligatorio' }, { status: 400 });
    }

    // Check if there's already an active session for this class
    const existingSession = await db.liveSession.findFirst({
      where: { classId, isActive: true },
    });

    if (existingSession) {
      return NextResponse.json({ session: existingSession, message: 'Ya hay una sesión activa' });
    }

    // Check class exists
    const classExists = await db.class.findUnique({ where: { id: classId } });
    if (!classExists) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
    }

    // Create new live session
    const session = await db.liveSession.create({
      data: {
        classId,
        teacherId: 'default-teacher',
        isActive: true,
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Live session start error:', error);
    return NextResponse.json({ error: 'Error al iniciar sesión en vivo' }, { status: 500 });
  }
}
