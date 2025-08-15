// Re-export types from components for convenience
export type { HeaderProps, BreadcrumbItem } from '../components/Header'
export type { DashboardLayoutProps } from '../components/DashboardLayout'

// Additional dashboard-related types
export interface DashboardUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role?: string
}

export interface DashboardRoute {
  path: string
  label: string
  icon?: React.ComponentType
  children?: DashboardRoute[]
}

export interface DashboardConfig {
  title: string
  logo?: string
  defaultRoute: string
  features?: {
    search?: boolean
    notifications?: boolean
    userMenu?: boolean
  }
}