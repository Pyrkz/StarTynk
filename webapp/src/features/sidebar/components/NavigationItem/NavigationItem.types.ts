import type { NavigationItem } from '../../types'

export interface NavigationItemProps {
  item: NavigationItem
  level?: number
  isActive?: boolean
  isCollapsed?: boolean
  showTooltip?: boolean
  onNavigate?: (item: NavigationItem) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
  hasChildren?: boolean
}

export interface NavigationSubItemProps {
  item: NavigationItem
  level: number
  isActive?: boolean
  onNavigate?: (item: NavigationItem) => void
}