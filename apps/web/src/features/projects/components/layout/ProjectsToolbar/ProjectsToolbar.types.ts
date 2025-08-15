export type ViewMode = 'grid' | 'list'

export interface ProjectsToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onRefresh?: () => void
  isLoading?: boolean
  className?: string
}