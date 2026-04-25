import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'chambari-academy-secret-key-2024'

interface TokenPayload {
  id: string
  email: string
  role: string
  name: string
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(':')
  const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(computedHash))
}

export function generateToken(user: { id: string; email: string; role: string; name: string }): string {
  const payload: TokenPayload & { iat: number; exp: number } = {
    ...user,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  }
  const payloadStr = JSON.stringify(payload)
  const base64 = Buffer.from(payloadStr).toString('base64url')
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(base64).digest('base64url')
  return `${base64}.${signature}`
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [base64, signature] = token.split('.')
    if (!base64 || !signature) return null

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(base64)
      .digest('base64url')

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null
    }

    const payload = JSON.parse(Buffer.from(base64, 'base64url').toString())

    if (payload.exp && Date.now() > payload.exp) {
      return null
    }

    return { id: payload.id, email: payload.email, role: payload.role, name: payload.name }
  } catch {
    return null
  }
}

export function getUserFromRequest(request: Request): TokenPayload | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}
