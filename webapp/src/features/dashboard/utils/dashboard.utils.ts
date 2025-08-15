import type { BreadcrumbItem } from '../components/Header'

/**
 * Helper function to create breadcrumbs with Dashboard as the base
 */
export const createBreadcrumbs = (items: BreadcrumbItem[]): BreadcrumbItem[] => {
  return [
    { label: 'Dashboard', href: '/dashboard' },
    ...items
  ]
}

/**
 * Generate page title from pathname
 */
export const generatePageTitle = (pathname: string): string => {
  const pathSegments = pathname.split('/').filter(Boolean)
  if (pathSegments.length > 1) {
    const lastSegment = pathSegments[pathSegments.length - 1]
    // Convert from kebab-case to Title Case
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  return 'Dashboard'
}

/**
 * Format notification count for display
 */
export const formatNotificationCount = (count: number): string => {
  if (count > 99) {
    return '99+'
  }
  return count.toString()
}