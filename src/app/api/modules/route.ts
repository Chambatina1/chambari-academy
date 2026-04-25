import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const where = user.role === 'STUDENT' ? { status: 'PUBLISHED' } : {}

    const modules = await db.module.findMany({
      where,
      include: {
        teacher: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { lessons: true } },
      },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json(modules)
  } catch (error) {
    console.error('List modules error:', error)
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
    const { title, description, orderIndex, status } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const moduleData = await db.module.create({
      data: {
        title,
        description: description || null,
        orderIndex: orderIndex || 0,
        status: status || 'DRAFT',
        teacherId: user.id,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true, avatar: true } },
      },
    })

    return NextResponse.json({ module: moduleData }, { status: 201 })
  } catch (error) {
    console.error('Create module error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
