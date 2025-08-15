import { useState, useEffect, useCallback, useMemo } from 'react'
import { ProjectListItem, ProjectFilters } from '../types'

interface UseProjectsOptions {
  page?: number
  limit?: number
  filters?: ProjectFilters
}

interface UseProjectsReturn {
  projects: ProjectListItem[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  refetch: () => Promise<void>
}

export function useProjects({
  page = 1,
  limit = 10,
  filters = {}
}: UseProjectsOptions = {}): UseProjectsReturn {
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    totalPages: 0,
  })

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [
    filters.search,
    filters.status,
    filters.developerId,
    filters.coordinatorId,
    filters.startDate?.getTime(),
    filters.endDate?.getTime(),
  ])

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      // Add filters to params
      if (memoizedFilters.search) params.append('search', memoizedFilters.search)
      if (memoizedFilters.status) params.append('status', memoizedFilters.status)
      if (memoizedFilters.developerId) params.append('developerId', memoizedFilters.developerId)
      if (memoizedFilters.coordinatorId) params.append('coordinatorId', memoizedFilters.coordinatorId)
      if (memoizedFilters.startDate) params.append('startDate', memoizedFilters.startDate.toISOString())
      if (memoizedFilters.endDate) params.append('endDate', memoizedFilters.endDate.toISOString())

      const response = await fetch(`/api/projects?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Błąd pobierania projektów')
      }

      const data = await response.json()
      setProjects(data.projects)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [page, limit, memoizedFilters])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    loading,
    error,
    pagination,
    refetch: fetchProjects,
  }
}