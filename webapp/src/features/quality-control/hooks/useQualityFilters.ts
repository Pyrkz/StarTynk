'use client'

import { useState, useCallback, useMemo } from 'react'
import type { QualityControl, QualityFilters, SortConfig } from '../types'

interface UseQualityFiltersReturn {
  filteredControls: QualityControl[]
  filterCounts: Record<string, number>
  activeFiltersCount: number
  clearFilters: () => void
  hasActiveFilters: boolean
}

export function useQualityFilters(
  controls: QualityControl[],
  filters: QualityFilters,
  sort: SortConfig
): UseQualityFiltersReturn {
  // Filter the controls
  const filteredControls = useMemo(() => {
    let filtered = [...controls]

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(control => control.status === filters.status)
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(control => control.priority === filters.priority)
    }

    // Project filter
    if (filters.projectId !== 'all') {
      filtered = filtered.filter(control => control.task.projectId === filters.projectId)
    }

    // Month filter
    if (filters.month && filters.month !== 'all') {
      filtered = filtered.filter(control => {
        const controlDate = new Date(control.controlDate)
        return controlDate.getMonth() + 1 === filters.month
      })
    }

    // Year filter
    if (filters.year && filters.year !== 'all') {
      filtered = filtered.filter(control => {
        const controlDate = new Date(control.controlDate)
        return controlDate.getFullYear() === filters.year
      })
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(control => {
        const controlDate = new Date(control.controlDate)
        if (filters.dateRange.start && controlDate < filters.dateRange.start) return false
        if (filters.dateRange.end && controlDate > filters.dateRange.end) return false
        return true
      })
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(control => {
        return (
          control.task.title.toLowerCase().includes(searchLower) ||
          control.task.project.name.toLowerCase().includes(searchLower) ||
          control.controller.name.toLowerCase().includes(searchLower) ||
          control.task.assignments.some(a => 
            a.user.name.toLowerCase().includes(searchLower)
          )
        )
      })
    }

    // Assignee filter
    if (filters.assigneeId !== 'all') {
      filtered = filtered.filter(control =>
        control.task.assignments.some(a => a.user.id === filters.assigneeId)
      )
    }

    // Sort the results
    filtered.sort((a, b) => {
      const multiplier = sort.order === 'asc' ? 1 : -1
      
      switch (sort.field) {
        case 'date':
          return (new Date(a.controlDate).getTime() - new Date(b.controlDate).getTime()) * multiplier
        case 'score':
          return (a.qualityScore - b.qualityScore) * multiplier
        case 'completion':
          return (a.completionRate - b.completionRate) * multiplier
        case 'priority':
          const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
          const aPriority = priorityOrder[a.priority || 'MEDIUM']
          const bPriority = priorityOrder[b.priority || 'MEDIUM']
          return (aPriority - bPriority) * multiplier
        case 'project':
          return a.task.project.name.localeCompare(b.task.project.name) * multiplier
        default:
          return 0
      }
    })

    return filtered
  }, [controls, filters, sort])

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: controls.length,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      PARTIALLY_APPROVED: 0,
      IN_REVIEW: 0,
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    }

    controls.forEach(control => {
      counts[control.status] = (counts[control.status] || 0) + 1
      if (control.priority) {
        counts[control.priority] = (counts[control.priority] || 0) + 1
      }
    })

    return counts
  }, [controls])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.status !== 'all') count++
    if (filters.priority !== 'all') count++
    if (filters.projectId !== 'all') count++
    if (filters.month && filters.month !== 'all') count++
    if (filters.year && filters.year !== 'all') count++
    if (filters.dateRange.start || filters.dateRange.end) count++
    if (filters.search) count++
    if (filters.assigneeId !== 'all') count++
    return count
  }, [filters])

  const hasActiveFilters = activeFiltersCount > 0

  const clearFilters = useCallback(() => {
    // This would be handled by the parent component
    // by calling updateFilters with default values
  }, [])

  return {
    filteredControls,
    filterCounts,
    activeFiltersCount,
    clearFilters,
    hasActiveFilters
  }
}