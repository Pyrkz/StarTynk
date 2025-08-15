'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { NAVIGATION_VARIANTS } from '../../lib/constants'
import type { NavigationSubItemProps } from './NavigationItem.types'

export const NavigationSubItem: React.FC<NavigationSubItemProps> = ({
  item,
  level,
  isActive = false,
  onNavigate,
}) => {
  const handleClick = () => {
    if (onNavigate && !item.disabled) {
      onNavigate(item)
    }
    item.onClick?.()
  }

  const content = (
    <>
      {/* Indentation based on level */}
      <div 
        className="flex-shrink-0" 
        style={{ width: `${level * 16}px` }} 
      />
      
      <span className={cn(
        "flex-1 text-left truncate text-sm transition-all duration-200",
        isActive ? "font-semibold text-neutral-900" : "font-medium text-neutral-600"
      )}>
        {item.label}
      </span>
      
      {item.badge && (
        <span
          className={cn(
            'ml-2 inline-flex items-center justify-center',
            'px-2 py-0.5 text-[10px] font-semibold rounded-full',
            NAVIGATION_VARIANTS.badge[item.badge.variant || 'default'],
            'shadow-sm'
          )}
        >
          {item.badge.content}
        </span>
      )}
    </>
  )

  const className = cn(
    'group relative flex items-center w-full px-3 py-1.5 rounded-lg',
    'transition-all duration-200',
    'hover:translate-x-0.5',
    item.disabled
      ? NAVIGATION_VARIANTS.item.disabled
      : isActive
      ? NAVIGATION_VARIANTS.item.subitem.active
      : NAVIGATION_VARIANTS.item.subitem.default
  )

  if (item.href && !item.disabled) {
    return (
      <Link
        href={item.href}
        onClick={handleClick}
        className={className}
        target={item.external ? '_blank' : undefined}
        rel={item.external ? 'noopener noreferrer' : undefined}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={item.disabled}
      className={className}
    >
      {content}
    </button>
  )
}