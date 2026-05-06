import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const after = searchParams.get('after');

    const whereClause: Record<string, unknown> = { sessionId };
    if (after) {
      whereClause.createdAt = { gt: new Date(after) };
    }

    const annotations = await db.annotation.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ annotations });
  } catch (error) {
    console.error('Annotations GET error:', error);
    return NextResponse.json({ error: 'Error al obtener anotaciones' }, { status: 500 });
  }
}
