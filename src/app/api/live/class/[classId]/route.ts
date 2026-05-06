import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    const session = await db.liveSession.findFirst({
      where: { classId, isActive: true },
      include: {
        annotations: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ session: null, isActive: false });
    }

    return NextResponse.json({ session, isActive: true });
  } catch (error) {
    console.error('Live session check error:', error);
    return NextResponse.json({ error: 'Error al verificar sesión' }, { status: 500 });
  }
}
