import type { LucideIcon } from 'lucide-react'
import type { Role } from '@repo/database'

// Navigation item types
export interface NavigationItem {
  id: string
  label: string
  href?: string
  icon?: LucideIcon
  description?: string
  badge?: NavigationBadge
  requiredRoles?: Role[]
  children?: NavigationItem[]
  external?: boolean
  disabled?: boolean
  shortcut?: string
  onClick?: () => void
}

export interface NavigationBadge {
  content: string | number
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  pulse?: boolean
}

export interface NavigationGroup {
  id: string
  label?: string
  icon?: LucideIcon
  items: NavigationItem[]
  collapsible?: boolean
  defaultExpanded?: boolean
  requiredRoles?: Role[]
}

// Sidebar state types
export interface SidebarState {
  isCollapsed: boolean
  expandedGroups: string[]
  activeItemId: string | null
  recentItems: string[]
}

export interface SidebarContextValue extends SidebarState {
  toggleCollapsed: () => void
  setCollapsed: (collapsed: boolean) => void
  toggleGroup: (groupId: string) => void
  setActiveItem: (itemId: string | null) => void
  addRecentItem: (itemId: string) => void
  clearRecentItems: () => void
}

// Component props types
export interface SidebarProps {
  groups: NavigationGroup[]
  className?: string
  defaultCollapsed?: boolean
  collapsible?: boolean
  showHeader?: boolean
  showFooter?: boolean
  onNavigate?: (item: NavigationItem) => void
}

export interface NavigationItemProps {
  item: NavigationItem
  level?: number
  isActive?: boolean
  isCollapsed?: boolean
  showTooltip?: boolean
  onNavigate?: (item: NavigationItem) => void
}

export interface NavigationGroupProps {
  group: NavigationGroup
  isCollapsed?: boolean
  onNavigate?: (item: NavigationItem) => void
}

// Configuration types
export interface SidebarConfig {
  defaultCollapsed: boolean
  collapsedWidth: number
  expandedWidth: number
  animationDuration: number
  maxRecentItems: number
  persistState: boolean
  showSearch: boolean
  showUserInfo: boolean
}