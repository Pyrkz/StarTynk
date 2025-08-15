export interface AdvancedFiltersProps {
  isOpen: boolean
  onToggle: () => void
  developerId?: string
  onDeveloperChange: (developerId: string) => void
  dateRange?: {
    start: Date
    end: Date
  }
  onDateRangeChange: (range: { start: Date; end: Date } | undefined) => void
  sortBy: string
  onSortByChange: (sortBy: string) => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
  onReset: () => void
  developers: Array<{ id: string; name: string }>
  isLoading?: boolean
}