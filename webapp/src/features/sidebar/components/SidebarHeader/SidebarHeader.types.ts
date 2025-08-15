export interface SidebarHeaderProps {
  isCollapsed: boolean
  onToggle: () => void
  logoSrc?: string
  logoAlt?: string
  title?: string
  className?: string
}