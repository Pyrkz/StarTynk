import type { BreadcrumbItem } from '../../types'

export interface HeaderProps {
  /**
   * Callback when mobile menu is toggled
   */
  onMenuToggle?: () => void
  /**
   * Show search bar
   */
  showSearch?: boolean
  /**
   * Page title (used when no breadcrumbs)
   */
  title?: string
  /**
   * Breadcrumb navigation items
   */
  breadcrumbs?: BreadcrumbItem[]
  /**
   * Search suggestions
   */
  searchSuggestions?: string[]
  /**
   * Search handler
   */
  onSearch?: (query: string) => void
  /**
   * Additional className
   */
  className?: string
  /**
   * Override for mobile menu open state
   */
  isMobileMenuOpen?: boolean
}