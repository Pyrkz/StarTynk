import type { LucideIcon } from 'lucide-react'

export interface CollapsibleSectionProps {
  id: string
  label: string
  icon?: LucideIcon
  children: React.ReactNode
  defaultExpanded?: boolean
  className?: string
}