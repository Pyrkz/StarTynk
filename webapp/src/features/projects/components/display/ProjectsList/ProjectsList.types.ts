import { Project } from '@/features/projekty/types'

export interface ProjectsListProps {
  projects: Project[]
  onProjectClick?: (project: Project) => void
  showColumns?: {
    developer: boolean
    dates: boolean
    status: boolean
    progress: boolean
    value: boolean
    actions: boolean
  }
  className?: string
}