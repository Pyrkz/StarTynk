import type { BreadcrumbItem } from '../../types'

export interface NavigationBreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  maxItems?: number
}