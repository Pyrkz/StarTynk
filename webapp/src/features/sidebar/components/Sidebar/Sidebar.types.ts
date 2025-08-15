import type { NavigationItem } from '../../types'

export interface SidebarProps {
  defaultCollapsed?: boolean
  className?: string
  logoSrc?: string
  logoAlt?: string
  title?: string
  version?: string
  onToggleOverride?: () => void
}

export interface SidebarConfig {
  navigation: NavigationItem[]
  enableSearch?: boolean
  enableNotifications?: boolean
  enablePinning?: boolean
}