'use client'

import React from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileMenuToggleProps {
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export const MobileMenuToggle: React.FC<MobileMenuToggleProps> = ({
  isOpen,
  onToggle,
  className,
}) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'rounded-lg p-2 transition-all lg:hidden',
        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
        isOpen && 'bg-gray-100',
        className
      )}
      aria-expanded={isOpen}
      aria-label={isOpen ? 'Zamknij menu' : 'Otwórz menu'}
    >
      <div className="relative h-5 w-5">
        <Menu 
          className={cn(
            'absolute inset-0 h-5 w-5 transition-all',
            isOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
          )}
        />
        <X 
          className={cn(
            'absolute inset-0 h-5 w-5 transition-all',
            isOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
          )}
        />
      </div>
    </button>
  )
}