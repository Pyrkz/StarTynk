'use client'

import { useState, useEffect, useCallback } from 'react'
import { qualityControlService } from '../services/qualityControlService'
import type { QualityControlStats } from '../types'

interface UseQualityStatsReturn {
  stats: QualityControlStats | null
  isLoading: boolean
  error: Error | null
  refreshStats: () => void
}

export function useQualityStats(): UseQualityStatsReturn {
  const [stats, setStats] = useState<QualityControlStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await qualityControlService.fetchQualityStats()
      setStats(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refreshStats: fetchStats
  }
}