'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import type { Role } from '@prisma/client'
import { roleHierarchy } from '../lib/role-utils'

interface UseAuthReturn {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: Role
  } | null
  isAuthenticated: boolean
  isLoading: boolean
  hasRole: (requiredRole: Role) => boolean
  hasAnyRole: (roles: Role[]) => boolean
  canAccess: (minRole: Role) => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const isLoading = status === 'loading'
  const isAuthenticated = !!session?.user
  
  const hasRole = useCallback((requiredRole: Role): boolean => {
    if (!session?.user?.role) return false
    return session.user.role === requiredRole
  }, [session])
  
  const hasAnyRole = useCallback((roles: Role[]): boolean => {
    if (!session?.user?.role) return false
    return roles.includes(session.user.role)
  }, [session])
  
  const canAccess = useCallback((minRole: Role): boolean => {
    if (!session?.user?.role) return false
    return roleHierarchy[session.user.role] >= roleHierarchy[minRole]
  }, [session])
  
  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    
    if (result?.error) {
      throw new Error(result.error)
    }
    
    if (result?.ok) {
      router.push('/dashboard')
    }
  }, [router])
  
  const logout = useCallback(async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }, [router])
  
  return {
    user: session?.user || null,
    isAuthenticated,
    isLoading,
    hasRole,
    hasAnyRole,
    canAccess,
    login,
    logout,
  }
}