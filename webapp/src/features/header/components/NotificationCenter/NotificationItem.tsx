'use client'

import React from 'react'
import { X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNotificationTime, getNotificationIcon } from '../../lib/utils'
import type { NotificationItemProps } from './Notification.types'

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onRemove,
  onAction,
}) => {
  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id)
    }
    if (notification.actionUrl && onAction) {
      onAction(notification)
    }
  }

  const typeColors = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
  }

  const priorityIndicator = {
    low: '',
    medium: 'border-l-2',
    high: 'border-l-4',
    urgent: 'border-l-4 animate-pulse',
  }

  return (
    <div
      className={cn(
        'group relative border-b border-gray-100 p-4 transition-all duration-200',
        'hover:bg-gray-50 hover:shadow-sm',
        !notification.read && 'bg-blue-50/30',
        typeColors[notification.type],
        priorityIndicator[notification.priority],
        notification.priority === 'high' && 'border-l-orange-500',
        notification.priority === 'urgent' && 'border-l-red-500'
      )}
    >
      <button
        onClick={handleClick}
        className="w-full text-left focus:outline-none"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <span className="text-xl" role="img" aria-label={notification.type}>
            {getNotificationIcon(notification.type)}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={cn(
                'text-sm font-medium text-gray-900',
                !notification.read && 'font-semibold'
              )}>
                {notification.title}
              </h4>
              
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(notification.id)
                }}
                className={cn(
                  'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
                  'rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600',
                  'transition-all duration-200 focus:opacity-100 focus:outline-none',
                  'hover:scale-110 active:scale-95'
                )}
                aria-label="Usuń powiadomienie"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-1 text-sm text-gray-600">
              {notification.message}
            </p>

            <div className="mt-2 flex items-center gap-4">
              <span className="text-xs text-gray-500">
                {formatNotificationTime(notification.timestamp)}
              </span>

              {notification.actionUrl && (
                <span className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                  {notification.actionLabel || 'Zobacz więcej'}
                  <ExternalLink className="h-3 w-3" />
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-500 animate-pulse" />
      )}
    </div>
  )
}