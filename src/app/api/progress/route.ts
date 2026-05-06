import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const progress = await db.progress.findMany({
      where: { studentId: 'default-student' },
      include: { class: { select: { title: true, topic: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Progress error:', error);
    return NextResponse.json({ error: 'Error al obtener progreso' }, { status: 500 });
  }
}
