import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['PUBLISHED', 'DRAFT', 'ARCHIVED'].includes(status)) {
      return NextResponse.json({ error: 'Status must be PUBLISHED, DRAFT, or ARCHIVED' }, { status: 400 })
    }

    const lesson = await db.lesson.update({
      where: { id },
      data: { status },
      include: {
        module: { select: { id: true, title: true } },
        teacher: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('Publish lesson error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
