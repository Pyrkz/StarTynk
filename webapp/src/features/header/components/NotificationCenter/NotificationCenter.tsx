'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Trash2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHeader } from '../../context/HeaderContext'
import { NotificationBadge } from './NotificationBadge'
import { NotificationItem } from './NotificationItem'
import { groupNotificationsByDate } from '../../lib/utils'
import { HEADER_CONSTANTS } from '../../lib/constants'
import type { NotificationCenterProps } from './Notification.types'
import type { Notification } from '../../types'

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification 
  } = useHeader()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleNotificationAction = (notification: Notification) => {
    if (notification.actionUrl) {
      setIsOpen(false)
      router.push(notification.actionUrl)
    }
  }

  const groupedNotifications = groupNotificationsByDate(notifications)

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/25 sm:hidden"
          style={{ zIndex: HEADER_CONSTANTS.Z_INDEX.NOTIFICATION_CENTER - 1 }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <div ref={dropdownRef} className={cn('relative', className)}>
        <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative rounded-lg p-2 transition-all duration-200',
          'hover:bg-gray-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          'active:scale-95 active:bg-gray-200',
          isOpen && 'bg-gray-100 scale-105'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Powiadomienia${unreadCount > 0 ? ` (${unreadCount} nieprzeczytane)` : ''}`}
      >
        <Bell className={cn(
          'h-5 w-5 text-gray-600 transition-transform duration-200',
          isOpen && 'rotate-12'
        )} />
        <NotificationBadge count={unreadCount} pulse={unreadCount > 0} />
      </button>

      {/* Dropdown */}
      <div
        className={cn(
          // Mobile: Full screen modal with flex layout
          'fixed inset-x-0 top-16 bottom-0 flex flex-col',
          // Desktop: Absolute positioned dropdown
          'sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:block',
          // Desktop: Fixed width dropdown
          'sm:w-96 sm:rounded-lg',
          // Common styles
          'bg-white shadow-lg ring-1 ring-gray-200',
          'focus:outline-none transition-all duration-200 ease-out',
          // Animation classes
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none',
          // Mobile specific animation
          'sm:origin-top-right'
        )}
        style={{ zIndex: HEADER_CONSTANTS.Z_INDEX.NOTIFICATION_CENTER }}
        role="menu"
        aria-orientation="vertical"
        aria-hidden={!isOpen}
      >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-base font-semibold text-gray-900">
              Powiadomienia
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Oznacz wszystkie jako przeczytane"
                  title="Oznacz wszystkie jako przeczytane"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/dashboard/settings/notifications')
                }}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Ustawienia powiadomień"
                title="Ustawienia powiadomień"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="flex-1 sm:flex-none sm:max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  Brak nowych powiadomień
                </p>
              </div>
            ) : (
              <div>
                {Object.entries(groupedNotifications).map(([date, items]) => (
                  <div key={date}>
                    <div className="sticky top-0 bg-gray-50 px-4 py-2">
                      <h4 className="text-xs font-medium uppercase text-gray-500">
                        {date}
                      </h4>
                    </div>
                    {items.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={markAsRead}
                        onRemove={removeNotification}
                        onAction={handleNotificationAction}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="mt-auto border-t border-gray-200 px-4 py-3 sm:mt-0">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/dashboard/notifications')
                }}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Zobacz wszystkie powiadomienia
              </button>
            </div>
          )}
      </div>
    </div>
    </>
  )
}