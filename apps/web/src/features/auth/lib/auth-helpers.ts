import { getServerSession } from 'next-auth'
import { authOptions } from './auth-options'
import { redirect } from 'next/navigation'
import type { Role } from '@repo/database'
import { hasRequiredRole } from './role-utils'

/**
 * Pobiera sesję użytkownika po stronie serwera
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

/**
 * Sprawdza czy użytkownik jest zalogowany, jeśli nie - przekierowuje do logowania
 */
export async function requireAuth(redirectTo: string = '/dashboard') {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(redirectTo)}`)
  }
  
  return user
}

/**
 * Sprawdza czy użytkownik ma wymaganą rolę, jeśli nie - przekierowuje
 */
export async function requireRole(role: Role, redirectTo: string = '/dashboard') {
  const user = await requireAuth(redirectTo)
  
  if (!hasRequiredRole(user.role, role)) {
    redirect('/unauthorized')
  }
  
  return user
}

/**
 * Sprawdza czy użytkownik ma którąkolwiek z wymaganych ról
 */
export async function requireAnyRole(roles: Role[], redirectTo: string = '/dashboard') {
  const user = await requireAuth(redirectTo)
  
  if (!roles.includes(user.role)) {
    redirect('/unauthorized')
  }
  
  return user
}

/**
 * Helper dla API routes - zwraca odpowiedź 401 jeśli brak autoryzacji
 */
export async function withAuth<T>(
  handler: (user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => Promise<T>
): Promise<T | Response> {
  const user = await getCurrentUser()
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  
  return handler(user)
}

/**
 * Helper dla API routes z wymogiem roli
 */
export async function withRole<T>(
  role: Role,
  handler: (user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => Promise<T>
): Promise<T | Response> {
  return withAuth(async (user) => {
    if (!hasRequiredRole(user.role, role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    return handler(user)
  })
}