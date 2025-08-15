import type { BreadcrumbItem } from '@/features/header'

export interface DashboardLayoutProps {
  children: React.ReactNode
  /**
   * Whether to show search in header
   */
  showSearch?: boolean
  /**
   * Page title for header
   */
  pageTitle?: string
  /**
   * Breadcrumb items for header navigation
   */
  breadcrumbs?: BreadcrumbItem[]
  /**
   * Number of notifications to display
   */
  notificationCount?: number
}