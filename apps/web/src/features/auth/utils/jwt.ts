// JWT utils - używane gdy potrzebna jest własna implementacja tokenów
// NextAuth zarządza tokenami automatycznie
import type { Role } from '@repo/database'

interface JWTPayload {
  id: string
  email: string
  role: Role
}

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

/**
 * Generuje JWT token
 */
export function generateJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d',
    issuer: 'startynk',
    audience: 'startynk-webapp'
  })
}

/**
 * Weryfikuje i dekoduje JWT token
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'startynk',
      audience: 'startynk-webapp'
    }) as JWTPayload
    
    return decoded
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

/**
 * Generuje refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '90d' }
  )
}

/**
 * Weryfikuje refresh token
 */
export function verifyRefreshToken(token: string): { id: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    if (decoded.type !== 'refresh') {
      return null
    }
    
    return { id: decoded.id }
  } catch (error) {
    console.error('Refresh token verification error:', error)
    return null
  }
}