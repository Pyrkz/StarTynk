'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  User, 
  Settings, 
  LogOut, 
  Shield,
  HelpCircle,
  ChevronDown
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { UserMenuItem } from './UserMenuItem'
import { roleNames } from '@/features/auth/lib/role-utils'
import { HEADER_CONSTANTS } from '../../lib/constants'
import type { UserMenuProps } from './UserMenu.types'

export const UserMenu: React.FC<UserMenuProps> = ({ user, className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const initials = user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email[0].toUpperCase()

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200',
          'hover:bg-gray-100 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          'active:scale-[0.98] active:bg-gray-200',
          isOpen && 'bg-gray-100 scale-[1.02]'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menu użytkownika"
      >
        <Avatar
          src={user.image || undefined}
          alt={user.name || user.email}
          fallback={initials}
          size="sm"
          className={cn(
            'transition-transform duration-200',
            isOpen && 'scale-110'
          )}
        />
        
        <div className="hidden lg:flex lg:items-center lg:gap-2">
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">
              {user.name || 'Użytkownik'}
            </p>
            <p className="text-xs text-gray-500">
              {roleNames[user.role]}
            </p>
          </div>
          <ChevronDown 
            className={cn(
              'h-4 w-4 text-gray-500 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown menu */}
      <div
        className={cn(
          'absolute right-0 mt-2 w-64 origin-top-right',
          'rounded-lg bg-white shadow-lg ring-1 ring-gray-200',
          'focus:outline-none transition-all duration-200 ease-out',
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        )}
        style={{ zIndex: HEADER_CONSTANTS.Z_INDEX.DROPDOWN }}
        role="menu"
        aria-orientation="vertical"
        aria-hidden={!isOpen}
      >
          {/* User info header */}
          <div className="border-b border-gray-200 px-4 py-3">
            <p className="text-sm font-medium text-gray-900">
              {user.name || 'Użytkownik'}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          <div className="py-1">
            <UserMenuItem
              icon={User}
              label="Mój profil"
              onClick={() => {
                setIsOpen(false)
                router.push('/dashboard/profile')
              }}
            />
            
            <UserMenuItem
              icon={Settings}
              label="Ustawienia"
              onClick={() => {
                setIsOpen(false)
                router.push('/dashboard/ustawienia')
              }}
            />
            
            {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
              <UserMenuItem
                icon={Shield}
                label="Panel administracyjny"
                onClick={() => {
                  setIsOpen(false)
                  router.push('/dashboard/admin')
                }}
              />
            )}
            
            <UserMenuItem divider />
            
            <UserMenuItem
              icon={HelpCircle}
              label="Pomoc i wsparcie"
              onClick={() => {
                setIsOpen(false)
                router.push('/dashboard/help')
              }}
            />
            
            <UserMenuItem
              icon={LogOut}
              label="Wyloguj się"
              onClick={handleSignOut}
              danger
            />
          </div>
      </div>
    </div>
  )
}