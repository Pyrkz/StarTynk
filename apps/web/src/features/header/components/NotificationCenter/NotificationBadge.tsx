'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { NotificationBadgeProps } from './Notification.types'

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  pulse = false,
  className,
}) => {
  if (count === 0) return null

  return (
    <div className={cn('absolute -right-1 -top-1', className)}>
      <div className="relative">
        {pulse && (
          <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" />
        )}
        <span
          className={cn(
            'relative flex h-5 min-w-[20px] items-center justify-center',
            'rounded-full bg-red-500 px-1.5 text-xs font-medium text-white'
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      </div>
    </div>
  )
}