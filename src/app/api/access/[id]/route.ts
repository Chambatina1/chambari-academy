import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

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
    await db.studentAccess.delete({ where: { id } })

    return NextResponse.json({ message: 'Access grant removed' })
  } catch (error) {
    console.error('Delete access grant error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
