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
    const lessonId = searchParams.get('lessonId')

    if (user.role === 'TEACHER') {
      // Teacher can see all screenshots, optionally filtered by lesson
      const screenshots = await db.screenshot.findMany({
        where: { ...(lessonId ? { lessonId } : {}) },
        include: {
          student: { select: { id: true, name: true, avatar: true } },
          lesson: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ screenshots })
    }

    // Student sees only their own screenshots
    const screenshots = await db.screenshot.findMany({
      where: {
        studentId: user.id,
        ...(lessonId ? { lessonId } : {}),
      },
      include: {
        lesson: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ screenshots })
  } catch (error) {
    console.error('List screenshots error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lessonId, imageUrl, caption } = body

    if (!lessonId || !imageUrl) {
      return NextResponse.json({ error: 'lessonId and imageUrl are required' }, { status: 400 })
    }

    const screenshot = await db.screenshot.create({
      data: {
        studentId: user.id,
        lessonId,
        imageUrl,
        caption: caption || null,
      },
      include: {
        lesson: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json({ screenshot }, { status: 201 })
  } catch (error) {
    console.error('Save screenshot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
