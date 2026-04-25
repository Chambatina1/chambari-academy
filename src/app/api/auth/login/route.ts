import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Profesores pueden entrar sin contraseña
    if (user.role === 'TEACHER' && !password) {
      const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name })
      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({ user: userWithoutPassword, token })
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const isValid = verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name })

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword, token })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
