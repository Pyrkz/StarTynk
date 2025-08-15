'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavigationBreadcrumbsProps } from './Breadcrumb.types'

export const NavigationBreadcrumbs: React.FC<NavigationBreadcrumbsProps> = ({
  items,
  className,
  maxItems = 4,
}) => {
  const displayItems = items.length > maxItems
    ? [
        items[0],
        { id: 'ellipsis', label: '...', icon: MoreHorizontal },
        ...items.slice(-(maxItems - 2))
      ]
    : items

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn('flex items-center', className)}
    >
      <ol className="flex items-center">
        {/* Home icon as first item if no items provided */}
        {items.length === 0 && (
          <li className="flex items-center">
            <Link
              href="/dashboard"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Strona główna"
            >
              <Home className="h-4 w-4" />
            </Link>
          </li>
        )}

        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1
          const Icon = item.icon

          return (
            <li key={item.id} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />
              )}
              
              {item.id === 'ellipsis' ? (
                <span className="px-2 text-gray-400">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ) : item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2 py-1',
                    'text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    'transition-colors'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-2 px-2 py-1 text-sm',
                    isLast ? 'font-medium text-gray-900' : 'text-gray-600'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}