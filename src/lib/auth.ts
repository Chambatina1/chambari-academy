import { createHash, randomBytes, createHmac } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'chambari-academy-secret-key-2024';

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha512')
    .update(password + salt)
    .digest('hex');
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  const [salt, hash] = storedPassword.split(':');
  const verifyHash = createHash('sha512')
    .update(password + salt)
    .digest('hex');
  return hash === verifyHash;
}

// JWT token management (simplified)
export function createToken(payload: { userId: string; email: string; role: string; name: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { userId: string; email: string; role: string; name: string } | null {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSignature = createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

// Get user from request
export function getUserFromRequest(request: Request): { userId: string; email: string; role: string; name: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.slice(7));
}
