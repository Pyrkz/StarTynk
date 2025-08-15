'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import type { Role } from '@repo/database'
import { roleHierarchy } from '@/features/auth/lib/role-utils'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: Role
  fallbackUrl?: string
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredRole = 'USER',
  fallbackUrl = '/dashboard'
}) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      const callbackUrl = encodeURIComponent(pathname)
      router.push(`/login?callbackUrl=${callbackUrl}`)
      return
    }

    // Check role permissions
    const userRole = session.user.role
    
    if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
      router.push(fallbackUrl)
      return
    }
  }, [session, status, router, requiredRole, pathname, fallbackUrl])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Ładowanie...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect in useEffect
  }

  const userRole = session.user.role
  
  if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="card max-w-md mx-auto text-center">
          <h1 className="heading-2 mb-3">Brak uprawnień</h1>
          <p className="text-body mb-6">Nie masz uprawnień do dostępu do tej strony.</p>
          <button
            onClick={() => router.push(fallbackUrl)}
            className="btn-secondary"
          >
            Wróć do panelu
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}