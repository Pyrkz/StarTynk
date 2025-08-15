import type { NavigationGroup, NavigationItem } from '../../types'

export interface NavigationGroupProps {
  group: NavigationGroup
  isCollapsed?: boolean
  onNavigate?: (item: NavigationItem) => void
}