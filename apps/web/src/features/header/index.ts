// Main components
export { Header } from './components/Header'
export { HeaderProvider, useHeader } from './context/HeaderContext'

// Sub-components (for advanced usage)
export { UserMenu } from './components/UserMenu'
export { NotificationCenter } from './components/NotificationCenter'
export { SearchBar } from './components/SearchBar'
export { NavigationBreadcrumbs } from './components/NavigationBreadcrumbs'
export { MobileMenuToggle } from './components/MobileMenu'

// Types
export type { HeaderProps } from './components/Header'
export type { 
  Notification, 
  NotificationType, 
  NotificationPriority,
  HeaderUser,
  BreadcrumbItem,
  SearchResult,
  RecentSearch,
  HeaderContextValue
} from './types'

// Hooks
export { useDebounce } from './hooks/useDebounce'

// Utils
export { 
  formatNotificationTime,
  groupNotificationsByDate,
  sanitizeHtml 
} from './lib/utils'