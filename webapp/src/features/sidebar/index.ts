// Main component
export { Sidebar } from './components/Sidebar'
export type { SidebarProps } from './components/Sidebar'

// Context
export { SidebarProvider, useSidebar } from './context/SidebarContext'

// Hooks
export { useNavigation } from './hooks/useNavigation'

// Types
export type {
  NavigationItem,
  NavigationGroup as NavigationGroupType,
  UserRole,
  NavigationPosition,
} from './types'

// Utils
export {
  filterNavigationByRole,
  findActiveItem,
  hasActiveChild,
} from './components/Sidebar'