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
    const senderId = searchParams.get('senderId')
    const receiverId = searchParams.get('receiverId')
    const lessonId = searchParams.get('lessonId')

    const where: Record<string, unknown> = {}

    // Users can only see their own conversations
    if (user.role === 'STUDENT') {
      where.OR = [{ senderId: user.id }, { receiverId: user.id }]
    } else if (senderId || receiverId) {
      if (senderId) where.senderId = senderId
      if (receiverId) where.receiverId = receiverId
    }

    if (lessonId) where.lessonId = lessonId

    const messages = await db.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Get messages error:', error)
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
    const { receiverId, lessonId, body: messageBody } = body

    if (!messageBody) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    }

    const message = await db.message.create({
      data: {
        senderId: user.id,
        receiverId: receiverId || null,
        lessonId: lessonId || null,
        body: messageBody,
        senderRole: user.role,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
