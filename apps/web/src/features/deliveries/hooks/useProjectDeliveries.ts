import { useState, useEffect, useCallback } from 'react'
import { type DeliveryListItem, type PaginationData, DeliveryStatus, DeliveryType } from '@/features/deliveries/types'

interface UseProjectDeliveriesOptions {
  searchTerm?: string
  status?: DeliveryStatus
  deliveryType?: DeliveryType
  startDate?: string
  endDate?: string
}

interface DeliveryStatistics {
  total: number
  pending: number
  completed: number
  totalValue: number
}

interface UseProjectDeliveriesResult {
  deliveries: DeliveryListItem[]
  pagination: PaginationData
  statistics: DeliveryStatistics
  loading: boolean
  error: string | null
  refetch: () => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
}

export function useProjectDeliveries(
  projectId: string,
  options: UseProjectDeliveriesOptions = {}
): UseProjectDeliveriesResult {
  const [deliveries, setDeliveries] = useState<DeliveryListItem[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [statistics, setStatistics] = useState<DeliveryStatistics>({
    total: 0,
    pending: 0,
    completed: 0,
    totalValue: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchDeliveries = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        projectId: projectId
      })

      if (options.searchTerm) queryParams.append('search', options.searchTerm)
      if (options.status) queryParams.append('status', options.status)
      if (options.deliveryType) queryParams.append('deliveryType', options.deliveryType)
      if (options.startDate) queryParams.append('startDate', options.startDate)
      if (options.endDate) queryParams.append('endDate', options.endDate)

      const response = await fetch(`/api/deliveries?${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries')
      }

      const data = await response.json()
      
      setDeliveries(data.deliveries || [])
      setPagination({
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 10,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      })

      // Calculate statistics from the deliveries
      const stats = (data.deliveries || []).reduce((acc: DeliveryStatistics, delivery: DeliveryListItem) => {
        acc.total++
        
        if (delivery.status === DeliveryStatus.PENDING) {
          acc.pending++
        } else if (delivery.status === DeliveryStatus.ACCEPTED) {
          acc.completed++
        }
        
        // Add total value if available
        if (delivery.totalValue) {
          acc.totalValue += delivery.totalValue
        }
        
        return acc
      }, { total: 0, pending: 0, completed: 0, totalValue: 0 })

      setStatistics(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setDeliveries([])
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      })
      setStatistics({
        total: 0,
        pending: 0,
        completed: 0,
        totalValue: 0
      })
    } finally {
      setLoading(false)
    }
  }, [projectId, page, pageSize, options])

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  return {
    deliveries,
    pagination,
    statistics,
    loading,
    error,
    refetch: fetchDeliveries,
    setPage,
    setPageSize
  }
}