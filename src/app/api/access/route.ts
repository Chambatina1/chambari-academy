import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const accessGrants = await db.studentAccess.findMany({
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true } },
        lesson: { select: { id: true, title: true, module: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(accessGrants)
  } catch (error) {
    console.error('List access grants error:', error)
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
    const { studentId, lessonId, accessFrom, accessUntil, active } = body

    if (!studentId || !lessonId) {
      return NextResponse.json({ error: 'studentId and lessonId are required' }, { status: 400 })
    }

    const accessGrant = await db.studentAccess.upsert({
      where: {
        studentId_lessonId: { studentId, lessonId },
      },
      create: {
        studentId,
        lessonId,
        accessFrom: accessFrom ? new Date(accessFrom) : null,
        accessUntil: accessUntil ? new Date(accessUntil) : null,
        active: active !== undefined ? active : true,
      },
      update: {
        accessFrom: accessFrom !== undefined ? (accessFrom ? new Date(accessFrom) : null) : undefined,
        accessUntil: accessUntil !== undefined ? (accessUntil ? new Date(accessUntil) : null) : undefined,
        active: active !== undefined ? active : undefined,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        lesson: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json({ accessGrant }, { status: 201 })
  } catch (error) {
    console.error('Create access grant error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
