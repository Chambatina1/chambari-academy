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
    const q = searchParams.get('q') || ''

    const entries = await db.phoneticEntry.findMany({
      where: q
        ? {
            OR: [
              { word: { contains: q } },
              { ipa: { contains: q } },
              { phoneticSpelling: { contains: q } },
              { translation: { contains: q } },
            ],
          }
        : {},
      orderBy: { word: 'asc' },
      take: 50,
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Search phonetic error:', error)
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
    const { word, ipa, phoneticSpelling, audioUrl, example, translation } = body

    if (!word || !ipa) {
      return NextResponse.json({ error: 'word and ipa are required' }, { status: 400 })
    }

    const entry = await db.phoneticEntry.upsert({
      where: { word },
      create: {
        word,
        ipa,
        phoneticSpelling: phoneticSpelling || null,
        audioUrl: audioUrl || null,
        example: example || null,
        translation: translation || null,
      },
      update: {
        ipa,
        phoneticSpelling: phoneticSpelling || null,
        audioUrl: audioUrl || null,
        example: example || null,
        translation: translation || null,
      },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Create phonetic entry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
