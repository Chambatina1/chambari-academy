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
    const { title, description, content, videoUrl, youtubeUrl, documentUrl, documentName, meetingUrl, meetingRoom, orderIndex, status } = body

    const lesson = await db.lesson.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(youtubeUrl !== undefined && { youtubeUrl }),
        ...(documentUrl !== undefined && { documentUrl }),
        ...(documentName !== undefined && { documentName }),
        ...(meetingUrl !== undefined && { meetingUrl }),
        ...(meetingRoom !== undefined && { meetingRoom }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(status !== undefined && { status }),
      },
      include: {
        module: { select: { id: true, title: true } },
        teacher: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('Update lesson error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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
    await db.lesson.delete({ where: { id } })

    return NextResponse.json({ message: 'Lesson deleted' })
  } catch (error) {
    console.error('Delete lesson error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
