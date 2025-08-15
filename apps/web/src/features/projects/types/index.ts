export interface ProjectMetrics {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onHoldProjects: number
  totalValue: number
  averageProgress: number
  upcomingDeadlines: number
}

export interface ProjectFiltersState {
  search: string
  status: string
  developerId?: string
  dateRange?: {
    start: Date
    end: Date
  }
  sortBy: ProjectSortOption
  sortOrder: 'asc' | 'desc'
}

export type ProjectSortOption = 
  | 'name'
  | 'startDate'
  | 'endDate'
  | 'status'
  | 'progress'
  | 'developer'
  | 'value'

export interface ProjectListSettings {
  viewMode: 'grid' | 'list'
  pageSize: number
  columnsVisible: {
    developer: boolean
    dates: boolean
    status: boolean
    progress: boolean
    value: boolean
    actions: boolean
  }
}