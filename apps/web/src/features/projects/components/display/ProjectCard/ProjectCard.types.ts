import { ProjectListItem } from '@/features/projekty/types'

export interface ProjectCardProps {
  project: ProjectListItem
  onClick?: (project: ProjectListItem) => void
  className?: string
}