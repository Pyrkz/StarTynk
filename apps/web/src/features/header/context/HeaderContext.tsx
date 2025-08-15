'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { HeaderContextValue, Notification } from '../types'
import { HEADER_CONSTANTS } from '../lib/constants'
import { generateId } from '../lib/utils'

const HeaderContext = createContext<HeaderContextValue | undefined>(undefined)

export const useHeader = () => {
  const context = useContext(HeaderContext)
  if (!context) {
    throw new Error('useHeader must be used within HeaderProvider')
  }
  return context
}

interface HeaderProviderProps {
  children: React.ReactNode
}

export const HeaderProvider: React.FC<HeaderProviderProps> = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Handle scroll effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const handleScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsScrolled(window.scrollY > 10)
      }, HEADER_CONSTANTS.DEBOUNCE.SCROLL)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeoutId)
    }
  }, [])

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HEADER_CONSTANTS.STORAGE.NOTIFICATIONS)
      if (stored) {
        const parsed = JSON.parse(stored)
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })))
      } else {
        // Set placeholder notifications
        setNotifications([
          {
            id: generateId(),
            type: 'info',
            priority: 'medium',
            title: 'Witaj w systemie!',
            message: 'To jest twoje pierwsze powiadomienie.',
            timestamp: new Date(),
            read: false,
          },
          {
            id: generateId(),
            type: 'success',
            priority: 'low',
            title: 'Profil zaktualizowany',
            message: 'Twoje dane zostały pomyślnie zapisane.',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            read: false,
          },
          {
            id: generateId(),
            type: 'warning',
            priority: 'high',
            title: 'Wymagana aktualizacja hasła',
            message: 'Ze względów bezpieczeństwa zalecamy zmianę hasła.',
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            read: false,
            actionUrl: '/dashboard/settings',
            actionLabel: 'Zmień hasło',
          },
        ])
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        HEADER_CONSTANTS.STORAGE.NOTIFICATIONS,
        JSON.stringify(notifications.slice(0, HEADER_CONSTANTS.LIMITS.MAX_NOTIFICATIONS))
      )
    } catch (error) {
      console.error('Failed to save notifications:', error)
    }
  }, [notifications])

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => !prev)
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const value: HeaderContextValue = {
    isScrolled,
    isMobileMenuOpen,
    isSearchOpen,
    toggleMobileMenu,
    toggleSearch,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  }

  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
}