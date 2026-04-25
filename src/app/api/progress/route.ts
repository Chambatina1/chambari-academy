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
    const studentId = searchParams.get('studentId')

    // Students can only see their own progress; teachers can query by studentId
    if (user.role === 'STUDENT') {
      const progress = await db.progress.findMany({
        where: { studentId: user.id },
        include: {
          lesson: { select: { id: true, title: true, module: { select: { id: true, title: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
      })
      return NextResponse.json(progress)
    }

    // Teacher
    const where: Record<string, unknown> = {}
    if (studentId) where.studentId = studentId

    const progress = await db.progress.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true } },
        lesson: { select: { id: true, title: true, module: { select: { id: true, title: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Get progress error:', error)
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
    const { studentId, lessonId, completed, progressPercent } = body

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    // Students can only update their own progress
    const targetStudentId = user.role === 'STUDENT' ? user.id : studentId
    if (!targetStudentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    const progress = await db.progress.upsert({
      where: {
        studentId_lessonId: { studentId: targetStudentId, lessonId },
      },
      create: {
        studentId: targetStudentId,
        lessonId,
        completed: completed || false,
        progressPercent: progressPercent || 0,
      },
      update: {
        completed: completed !== undefined ? completed : undefined,
        progressPercent: progressPercent !== undefined ? progressPercent : undefined,
      },
      include: {
        student: { select: { id: true, name: true } },
        lesson: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json({ progress })
  } catch (error) {
    console.error('Update progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
