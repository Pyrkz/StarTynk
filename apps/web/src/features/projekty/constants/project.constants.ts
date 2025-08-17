import { ProjectStatus } from '@repo/database/client-types'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planowanie',
  ACTIVE: 'Aktywny',
  PAUSED: 'Wstrzymany',
  COMPLETED: 'Zakończony',
  CANCELLED: 'Anulowany',
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, 'primary' | 'success' | 'warning' | 'error' | 'neutral'> = {
  PLANNING: 'primary',
  ACTIVE: 'success',
  PAUSED: 'warning',
  COMPLETED: 'neutral',
  CANCELLED: 'error',
}

export const PROJECT_STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  })
)

export const DEFAULT_PAGE_SIZE = 10

export const PROJECT_SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Najnowsze' },
  { value: 'createdAt_asc', label: 'Najstarsze' },
  { value: 'name_asc', label: 'Nazwa A-Z' },
  { value: 'name_desc', label: 'Nazwa Z-A' },
  { value: 'startDate_desc', label: 'Data rozpoczęcia (najnowsza)' },
  { value: 'startDate_asc', label: 'Data rozpoczęcia (najstarsza)' },
]