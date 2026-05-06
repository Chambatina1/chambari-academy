import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { published } = await request.json();

    const cls = await db.class.findUnique({ where: { id } });
    if (!cls) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
    }

    const updated = await db.class.update({
      where: { id },
      data: { published },
    });

    return NextResponse.json({ class: updated });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: 'Error al actualizar la clase' }, { status: 500 });
  }
}
