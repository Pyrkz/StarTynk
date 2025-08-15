'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { UserMenu } from '../UserMenu'
import { NotificationCenter } from '../NotificationCenter'
import { SearchBar } from '../SearchBar'
import { NavigationBreadcrumbs } from '../NavigationBreadcrumbs'
import { MobileMenuToggle } from '../MobileMenu'
import { useHeader } from '../../context/HeaderContext'
import { HEADER_CONSTANTS } from '../../lib/constants'
import type { HeaderProps } from './Header.types'

export const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  showSearch = false,
  title,
  breadcrumbs = [],
  searchSuggestions = [],
  onSearch,
  className,
  isMobileMenuOpen: isMobileMenuOpenProp,
}) => {
  const { data: session, status } = useSession()
  const { isScrolled, isMobileMenuOpen: contextMenuOpen, toggleMobileMenu } = useHeader()
  
  // Use prop if provided, otherwise use context
  const isMobileMenuOpen = isMobileMenuOpenProp !== undefined ? isMobileMenuOpenProp : contextMenuOpen

  const handleMenuToggle = () => {
    if (isMobileMenuOpenProp === undefined) {
      toggleMobileMenu()
    }
    onMenuToggle?.()
  }

  // Generate breadcrumbs from title if not provided
  const displayBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : (
    title ? [{ id: 'title', label: title }] : []
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-gray-200 bg-white',
        'transition-all duration-200',
        isScrolled && 'shadow-sm backdrop-blur-md bg-white/95',
        className
      )}
      style={{ zIndex: HEADER_CONSTANTS.Z_INDEX.HEADER }}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <MobileMenuToggle
              isOpen={isMobileMenuOpen}
              onToggle={handleMenuToggle}
            />

            {/* Breadcrumbs or title */}
            <div className="hidden lg:block">
              {displayBreadcrumbs.length > 0 ? (
                <NavigationBreadcrumbs items={displayBreadcrumbs} />
              ) : (
                <h1 className="text-xl font-semibold text-gray-900">
                  Dashboard
                </h1>
              )}
            </div>
          </div>

          {/* Center section - Search */}
          {showSearch && (
            <div className="hidden flex-1 max-w-xl mx-4 lg:block">
              <SearchBar
                onSearch={onSearch}
                suggestions={searchSuggestions}
                showRecent
              />
            </div>
          )}

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Mobile search */}
            {showSearch && (
              <div className="lg:hidden">
                <SearchBar
                  placeholder="Szukaj"
                  className="w-40"
                  onSearch={onSearch}
                  showRecent={false}
                />
              </div>
            )}

            {/* Notifications */}
            <NotificationCenter />

            {/* User menu */}
            {status === 'authenticated' && session?.user ? (
              <UserMenu
                user={{
                  id: session.user.id,
                  name: session.user.name,
                  email: session.user.email,
                  image: session.user.image,
                  role: session.user.role,
                }}
              />
            ) : status === 'loading' ? (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                <div className="hidden h-4 w-20 animate-pulse rounded bg-gray-200 lg:block" />
              </div>
            ) : null}
          </div>
        </div>

      {/* Mobile breadcrumbs */}
      {displayBreadcrumbs.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-2 lg:hidden">
          <NavigationBreadcrumbs items={displayBreadcrumbs} maxItems={3} />
        </div>
      )}
    </header>
  )
}