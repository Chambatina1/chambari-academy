import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cls = await db.class.findUnique({
      where: { id },
      include: {
        exercises: { orderBy: { orderIndex: 'asc' } },
        teacher: { select: { name: true } },
        progress: {
          where: { studentId: 'default-student' },
        },
      },
    });

    if (!cls) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ class: cls });
  } catch (error) {
    console.error('Class GET error:', error);
    return NextResponse.json({ error: 'Error al obtener la clase' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { documentUrl, documentName, videoUrl } = await request.json();

    const cls = await db.class.findUnique({ where: { id } });
    if (!cls) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
    }

    const updated = await db.class.update({
      where: { id },
      data: {
        ...(documentUrl !== undefined ? { documentUrl } : {}),
        ...(documentName !== undefined ? { documentName } : {}),
        ...(videoUrl !== undefined ? { videoUrl } : {}),
      },
    });

    return NextResponse.json({ class: updated });
  } catch (error) {
    console.error('Class PUT error:', error);
    return NextResponse.json({ error: 'Error al actualizar la clase' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cls = await db.class.findUnique({ where: { id } });
    if (!cls) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
    }

    await db.class.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Class DELETE error:', error);
    return NextResponse.json({ error: 'Error al eliminar la clase' }, { status: 500 });
  }
}
