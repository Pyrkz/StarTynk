import { ProjectMetrics } from '@/features/projects/types'

export interface ProjectsStatsProps {
  metrics: ProjectMetrics
  isLoading?: boolean
  className?: string
}