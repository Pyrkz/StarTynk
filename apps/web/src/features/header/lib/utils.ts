import { HEADER_CONSTANTS } from './constants'
import type { Notification, RecentSearch } from '../types'
import { createWebStorage } from '@repo/shared/storage'

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Format notification timestamp
 */
export function formatNotificationTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Teraz'
  if (minutes < 60) return `${minutes} min temu`
  if (hours < 24) return `${hours} godz. temu`
  if (days < 7) return `${days} dni temu`
  
  return date.toLocaleDateString('pl-PL')
}

/**
 * Group notifications by date
 */
export function groupNotificationsByDate(notifications: Notification[]) {
  const groups: Record<string, Notification[]> = {}
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  
  notifications.forEach(notification => {
    const dateStr = notification.timestamp.toDateString()
    let groupKey: string
    
    if (dateStr === today) {
      groupKey = 'Dzisiaj'
    } else if (dateStr === yesterday) {
      groupKey = 'Wczoraj'
    } else {
      groupKey = notification.timestamp.toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long'
      })
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(notification)
  })
  
  return groups
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'success':
      return '✅'
    case 'error':
      return '❌'
    case 'warning':
      return '⚠️'
    case 'info':
    default:
      return 'ℹ️'
  }
}

// Create a storage instance for recent searches
const recentSearchesStorage = createWebStorage<RecentSearch[]>({
  key: HEADER_CONSTANTS.STORAGE.RECENT_SEARCHES,
  defaultValue: [],
  // Custom deserializer to convert timestamp strings back to Date objects
  deserialize: (value: string) => {
    const searches = JSON.parse(value)
    return searches.map((s: any) => ({
      ...s,
      timestamp: new Date(s.timestamp)
    }))
  }
})

/**
 * Save recent searches using unified storage
 */
export async function saveRecentSearches(searches: RecentSearch[]) {
  try {
    await recentSearchesStorage.set(
      searches.slice(0, HEADER_CONSTANTS.LIMITS.MAX_RECENT_SEARCHES)
    )
  } catch (error) {
    console.error('Failed to save recent searches:', error)
  }
}

/**
 * Load recent searches using unified storage
 */
export function loadRecentSearches(): RecentSearch[] {
  try {
    return recentSearchesStorage.get()
  } catch (error) {
    console.error('Failed to load recent searches:', error)
    return []
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}