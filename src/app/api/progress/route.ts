import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userData = getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (userData.role === 'STUDENT') {
      const progress = await db.progress.findMany({
        where: { studentId: userData.userId },
        include: { class: { select: { title: true, topic: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      return NextResponse.json({ progress });
    }

    // Teacher sees all student progress
    const progress = await db.progress.findMany({
      include: {
        student: { select: { id: true, name: true, email: true } },
        class: { select: { id: true, title: true, topic: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Progress error:', error);
    return NextResponse.json({ error: 'Error al obtener progreso' }, { status: 500 });
  }
}
