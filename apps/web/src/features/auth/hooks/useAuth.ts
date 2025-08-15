'use client'

import { useAuth as useSharedAuth, usePermissions } from '@repo/features/auth'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LoginRequestDTO } from '@repo/shared/types'
import { useCallback } from 'react'
import { roleHierarchy } from '../lib/role-utils'

export function useAuth() {
  const router = useRouter()
  const permissions = usePermissions()
  
  const auth = useSharedAuth({
    onLoginSuccess: () => {
      router.push('/dashboard')
    },
    onLogoutSuccess: async () => {
      await signOut({ redirect: false })
      router.push('/login')
    },
  })

  // Web-specific login that uses the shared auth
  const login = useCallback(async (email: string, password: string) => {
    const credentials: LoginRequestDTO = { email, password }
    auth.login(credentials)
  }, [auth])

  // Web-specific role check using roleHierarchy
  const canAccess = useCallback((minRole: any): boolean => {
    if (!auth.user?.role) return false
    return roleHierarchy[auth.user.role] >= roleHierarchy[minRole]
  }, [auth.user])

  return {
    ...auth,
    ...permissions,
    // Override specific methods for web compatibility
    login,
    canAccess,
    // Add web-specific methods
    redirectToLogin: () => router.push('/login'),
    redirectToDashboard: () => router.push('/dashboard'),
    redirectToProfile: () => router.push('/profile'),
  }
}