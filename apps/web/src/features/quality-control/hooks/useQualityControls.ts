'use client'

import { useState, useEffect, useCallback } from 'react'
import { qualityControlService } from '../services/qualityControlService'
import type { QualityControl, QualityFilters, SortConfig } from '../types'

interface UseQualityControlsReturn {
  qualityControls: QualityControl[]
  isLoading: boolean
  error: Error | null
  filters: QualityFilters
  sort: SortConfig
  pagination: {
    page: number
    totalPages: number
    total: number
  }
  updateFilters: (filters: Partial<QualityFilters>) => void
  updateSort: (sort: SortConfig) => void
  refreshData: () => void
  updateQualityControl: (id: string, updates: Partial<QualityControl>) => Promise<void>
}

const defaultFilters: QualityFilters = {
  status: 'all',
  priority: 'all',
  projectId: 'all',
  dateRange: { start: null, end: null },
  search: '',
  assigneeId: 'all',
  month: 'all',
  year: 'all'
}

const defaultSort: SortConfig = {
  field: 'date',
  order: 'desc'
}

export function useQualityControls(): UseQualityControlsReturn {
  const [qualityControls, setQualityControls] = useState<QualityControl[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [filters, setFilters] = useState<QualityFilters>(defaultFilters)
  const [sort, setSort] = useState<SortConfig>(defaultSort)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await qualityControlService.fetchQualityControls({
        filters,
        sort,
        page: pagination.page
      })

      setQualityControls(response.data)
      setPagination({
        page: response.page,
        totalPages: response.totalPages,
        total: response.total
      })
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [filters, sort, pagination.page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateFilters = useCallback((newFilters: Partial<QualityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  const updateSort = useCallback((newSort: SortConfig) => {
    setSort(newSort)
  }, [])

  const refreshData = useCallback(() => {
    fetchData()
  }, [fetchData])

  const updateQualityControl = useCallback(async (
    id: string, 
    updates: Partial<QualityControl>
  ) => {
    try {
      const updated = await qualityControlService.updateQualityControl(id, updates)
      setQualityControls(prev => 
        prev.map(qc => qc.id === id ? updated : qc)
      )
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [])

  return {
    qualityControls,
    isLoading,
    error,
    filters,
    sort,
    pagination,
    updateFilters,
    updateSort,
    refreshData,
    updateQualityControl
  }
}