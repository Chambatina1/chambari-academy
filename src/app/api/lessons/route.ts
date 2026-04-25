import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')

    if (user.role === 'STUDENT') {
      // Students can only see published lessons they have access to
      const accessGrants = await db.studentAccess.findMany({
        where: { studentId: user.id, active: true },
        select: { lessonId: true },
      })
      const accessibleLessonIds = accessGrants.map((g) => g.lessonId)

      const lessons = await db.lesson.findMany({
        where: {
          ...(moduleId ? { moduleId } : {}),
          status: 'PUBLISHED',
          ...(accessibleLessonIds.length > 0 ? { id: { in: accessibleLessonIds } } : { id: 'none' }),
        },
        include: {
          module: { select: { id: true, title: true } },
          teacher: { select: { id: true, name: true, avatar: true } },
          _count: { select: { exercises: true } },
        },
        orderBy: { orderIndex: 'asc' },
      })

      return NextResponse.json(lessons)
    }

    // Teacher sees all
    const lessons = await db.lesson.findMany({
      where: {
        ...(moduleId ? { moduleId } : {}),
      },
      include: {
        module: { select: { id: true, title: true } },
        teacher: { select: { id: true, name: true, avatar: true } },
        _count: { select: { exercises: true } },
      },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('List lessons error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { moduleId, title, description, content, videoUrl, youtubeUrl, documentUrl, documentName, meetingUrl, meetingRoom, orderIndex, status } = body

    if (!moduleId || !title) {
      return NextResponse.json({ error: 'moduleId and title are required' }, { status: 400 })
    }

    const lesson = await db.lesson.create({
      data: {
        moduleId,
        teacherId: user.id,
        title,
        description: description || null,
        content: content || null,
        videoUrl: videoUrl || null,
        youtubeUrl: youtubeUrl || null,
        documentUrl: documentUrl || null,
        documentName: documentName || null,
        meetingUrl: meetingUrl || null,
        meetingRoom: meetingRoom || null,
        orderIndex: orderIndex || 0,
        status: status || 'DRAFT',
      },
      include: {
        module: { select: { id: true, title: true } },
        teacher: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ lesson }, { status: 201 })
  } catch (error) {
    console.error('Create lesson error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
