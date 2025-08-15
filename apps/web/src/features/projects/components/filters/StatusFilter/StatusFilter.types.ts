import { ProjectStatus } from '@/features/projekty/types'

export interface StatusOption {
  value: ProjectStatus | 'ALL'
  label: string
  color?: string
}

export interface StatusFilterProps {
  value: ProjectStatus | 'ALL'
  onChange: (status: ProjectStatus | 'ALL') => void
  options: StatusOption[]
  className?: string
}