import type { Role } from '@repo/database'

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

// User types
export interface HeaderUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: Role
}

// Breadcrumb types
export interface BreadcrumbItem {
  id: string
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

// Search types
export interface SearchResult {
  id: string
  title: string
  description?: string
  category: string
  url: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface RecentSearch {
  id: string
  query: string
  timestamp: Date
  resultsCount: number
}

// Header context types
export interface HeaderContextValue {
  isScrolled: boolean
  isMobileMenuOpen: boolean
  isSearchOpen: boolean
  toggleMobileMenu: () => void
  toggleSearch: () => void
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
}