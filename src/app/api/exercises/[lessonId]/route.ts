import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId } = await params

    // Students can only access exercises for lessons they have access to
    if (user.role === 'STUDENT') {
      const access = await db.studentAccess.findUnique({
        where: { studentId_lessonId: { studentId: user.id, lessonId } },
      })
      if (!access || !access.active) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const exercises = await db.exercise.findMany({
      where: { lessonId },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error('List exercises error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { lessonId } = await params
    const result = await db.exercise.deleteMany({ where: { lessonId } })

    return NextResponse.json({ message: `Deleted ${result.count} exercises` })
  } catch (error) {
    console.error('Delete exercises error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
