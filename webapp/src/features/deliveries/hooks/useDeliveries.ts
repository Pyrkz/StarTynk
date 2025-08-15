import { useState, useEffect, useCallback } from 'react'
import type {
  DeliveryListItem,
  DeliveryWithRelations,
  DeliveryFiltersInput,
  DeliveryStats,
  DeliveryListResponse,
  DeliveryDetailResponse,
  CreateDeliveryInput,
  UpdateDeliveryInput
} from '@/features/deliveries/types'
import { DeliveryStatus } from '@/features/deliveries/types'

// ============== DELIVERY LIST HOOK ==============

export interface UseDeliveriesOptions {
  initialFilters?: DeliveryFiltersInput
  autoFetch?: boolean
  pageSize?: number
}

export interface UseDeliveriesReturn {
  deliveries: DeliveryListItem[]
  stats: DeliveryStats | null
  isLoading: boolean
  error: string | null
  filters: DeliveryFiltersInput
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  
  // Actions
  fetchDeliveries: () => Promise<void>
  updateFilters: (newFilters: Partial<DeliveryFiltersInput>) => void
  clearFilters: () => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  refresh: () => Promise<void>
}

export const useDeliveries = (options: UseDeliveriesOptions = {}): UseDeliveriesReturn => {
  const {
    initialFilters = {},
    autoFetch = true,
    pageSize = 20
  } = options

  const [deliveries, setDeliveries] = useState<DeliveryListItem[]>([])
  const [stats, setStats] = useState<DeliveryStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DeliveryFiltersInput>(initialFilters)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0
  })

  const fetchDeliveries = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'dateRange' && typeof value === 'object') {
              acc.dateFrom = value.from.toISOString()
              acc.dateTo = value.to.toISOString()
            } else {
              acc[key] = value.toString()
            }
          }
          return acc
        }, {} as Record<string, string>)
      })

      const response = await fetch(`/api/deliveries?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch deliveries: ${response.statusText}`)
      }

      const data: DeliveryListResponse = await response.json()
      
      setDeliveries(data.deliveries)
      setPagination(data.pagination)
      
      // Fetch stats separately or include in response
      // For now, calculate basic stats from the data
      const basicStats: DeliveryStats = {
        totalDeliveries: data.pagination.total,
        pendingDeliveries: data.deliveries.filter(d => 
          d.status === DeliveryStatus.PENDING
        ).length,
        scheduledDeliveries: 0, // SCHEDULED status doesn't exist in enum
        completedDeliveries: data.deliveries.filter(d => 
          d.status === DeliveryStatus.ACCEPTED
        ).length,
        totalValue: data.deliveries.reduce((sum, d) => sum + Number(d.totalValue || 0), 0),
        averageDeliveryTime: 4, // Placeholder
        qualityIssueRate: 5, // Placeholder
        onTimeDeliveryRate: 85 // Placeholder
      }
      setStats(basicStats)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching deliveries:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filters, pagination.page, pagination.limit])

  const updateFilters = useCallback((newFilters: Partial<DeliveryFiltersInput>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, limit: size, page: 1 }))
  }, [])

  const refresh = useCallback(async () => {
    await fetchDeliveries()
  }, [fetchDeliveries])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchDeliveries()
    }
  }, [fetchDeliveries, autoFetch])

  return {
    deliveries,
    stats,
    isLoading,
    error,
    filters,
    pagination,
    fetchDeliveries,
    updateFilters,
    clearFilters,
    setPage,
    setPageSize,
    refresh
  }
}

// ============== SINGLE DELIVERY HOOK ==============

export interface UseDeliveryReturn {
  delivery: DeliveryWithRelations | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchDelivery: () => Promise<void>
  updateDelivery: (updates: UpdateDeliveryInput) => Promise<void>
  refreshDelivery: () => Promise<void>
}

export const useDelivery = (deliveryId: string): UseDeliveryReturn => {
  const [delivery, setDelivery] = useState<DeliveryWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDelivery = useCallback(async () => {
    if (!deliveryId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch delivery: ${response.statusText}`)
      }

      const data: DeliveryDetailResponse = await response.json()
      setDelivery(data.delivery)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching delivery:', err)
    } finally {
      setIsLoading(false)
    }
  }, [deliveryId])

  const updateDelivery = useCallback(async (updates: UpdateDeliveryInput) => {
    if (!deliveryId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error(`Failed to update delivery: ${response.statusText}`)
      }

      const updatedDelivery: DeliveryWithRelations = await response.json()
      setDelivery(updatedDelivery)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error updating delivery:', err)
      throw err // Re-throw to allow caller to handle
    } finally {
      setIsLoading(false)
    }
  }, [deliveryId])

  const refreshDelivery = useCallback(async () => {
    await fetchDelivery()
  }, [fetchDelivery])

  // Auto-fetch on mount and when deliveryId changes
  useEffect(() => {
    fetchDelivery()
  }, [fetchDelivery])

  return {
    delivery,
    isLoading,
    error,
    fetchDelivery,
    updateDelivery,
    refreshDelivery
  }
}

// ============== CREATE DELIVERY HOOK ==============

export interface UseCreateDeliveryReturn {
  isCreating: boolean
  error: string | null
  
  // Actions
  createDelivery: (input: CreateDeliveryInput) => Promise<DeliveryWithRelations>
  clearError: () => void
}

export const useCreateDelivery = (): UseCreateDeliveryReturn => {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createDelivery = useCallback(async (input: CreateDeliveryInput): Promise<DeliveryWithRelations> => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to create delivery: ${response.statusText}`)
      }

      const delivery: DeliveryWithRelations = await response.json()
      return delivery
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error creating delivery:', err)
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isCreating,
    error,
    createDelivery,
    clearError
  }
}

// ============== DELIVERY STATISTICS HOOK ==============

export interface UseDeliveryStatsReturn {
  stats: DeliveryStats | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchStats: () => Promise<void>
  refreshStats: () => Promise<void>
}

export const useDeliveryStats = (filters?: DeliveryFiltersInput): UseDeliveryStatsReturn => {
  const [stats, setStats] = useState<DeliveryStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams(
        Object.entries(filters || {}).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'dateRange' && typeof value === 'object') {
              acc.dateFrom = value.from.toISOString()
              acc.dateTo = value.to.toISOString()
            } else {
              acc[key] = value.toString()
            }
          }
          return acc
        }, {} as Record<string, string>)
      )

      const response = await fetch(`/api/deliveries/statistics?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch delivery statistics: ${response.statusText}`)
      }

      const statsData: DeliveryStats = await response.json()
      setStats(statsData)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching delivery statistics:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  const refreshStats = useCallback(async () => {
    await fetchStats()
  }, [fetchStats])

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    refreshStats
  }
}

// ============== DELIVERY PHOTOS HOOK ==============

export interface UseDeliveryPhotosReturn {
  isUploading: boolean
  error: string | null
  
  // Actions
  uploadPhotos: (deliveryId: string, files: FileList) => Promise<void>
  deletePhoto: (deliveryId: string, photoId: string) => Promise<void>
  clearError: () => void
}

export const useDeliveryPhotos = (): UseDeliveryPhotosReturn => {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadPhotos = useCallback(async (deliveryId: string, files: FileList) => {
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('photos', file)
      })

      const response = await fetch(`/api/deliveries/${deliveryId}/photos`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Failed to upload photos: ${response.statusText}`)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error uploading photos:', err)
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [])

  const deletePhoto = useCallback(async (deliveryId: string, photoId: string) => {
    setError(null)

    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/photos/${photoId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete photo: ${response.statusText}`)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error deleting photo:', err)
      throw err
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isUploading,
    error,
    uploadPhotos,
    deletePhoto,
    clearError
  }
}