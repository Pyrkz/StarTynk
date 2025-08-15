'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { UserMenuItemProps } from './UserMenu.types'

export const UserMenuItem: React.FC<UserMenuItemProps> = ({
  icon: Icon,
  label,
  onClick,
  danger = false,
  divider = false,
}) => {
  if (divider) {
    return <div className="my-1 h-px bg-gray-200" />
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 px-4 py-2 text-sm transition-all duration-150',
        'hover:bg-gray-50 hover:translate-x-1 focus:bg-gray-50 focus:outline-none',
        'active:scale-[0.98]',
        danger
          ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
          : 'text-gray-700 hover:text-gray-900'
      )}
    >
      <Icon className={cn(
        'h-4 w-4 transition-transform duration-150',
        'group-hover:scale-110'
      )} />
      <span className="font-medium">{label}</span>
    </button>
  )
}