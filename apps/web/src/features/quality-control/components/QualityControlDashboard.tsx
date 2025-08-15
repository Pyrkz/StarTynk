'use client'

import React from 'react'
import { QualityDashboardHeader } from './dashboard/QualityDashboardHeader'
import { QualityDashboardStats } from './dashboard/QualityDashboardStats'
import { QualityDashboardFilters } from './dashboard/QualityDashboardFilters'
import { QualityTaskList } from './list/QualityTaskList'
import { useQualityControls, useQualityStats, useQualityFilters } from '../hooks'

const defaultFilters = {
  status: 'all' as const,
  priority: 'all' as const,
  projectId: 'all',
  dateRange: { start: null, end: null },
  search: '',
  assigneeId: 'all',
  month: 'all' as const,
  year: 'all' as const
}

export const QualityControlDashboard: React.FC = () => {
  const {
    qualityControls,
    isLoading: isLoadingControls,
    filters,
    sort,
    updateFilters,
    updateSort,
    updateQualityControl
  } = useQualityControls()

  const {
    stats,
    isLoading: isLoadingStats
  } = useQualityStats()

  const {
    filteredControls,
    filterCounts,
    activeFiltersCount,
    hasActiveFilters
  } = useQualityFilters(qualityControls, filters, sort)

  const handleNewControl = () => {
    // TODO: Implement new control modal/navigation
    console.log('New control')
  }

  const handleClearFilters = () => {
    updateFilters(defaultFilters)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <QualityDashboardHeader
          onNewControl={handleNewControl}
          totalTasks={stats?.totalTasks}
        />

        {/* Statistics */}
        <QualityDashboardStats
          stats={stats}
          isLoading={isLoadingStats}
        />

        {/* Filters */}
        <QualityDashboardFilters
          filters={filters}
          sort={sort}
          filterCounts={filterCounts}
          activeFiltersCount={activeFiltersCount}
          onFiltersChange={updateFilters}
          onSortChange={updateSort}
          onClearFilters={handleClearFilters}
        />

        {/* Task List */}
        <QualityTaskList
          qualityControls={filteredControls}
          isLoading={isLoadingControls}
          hasFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onNewControl={handleNewControl}
          onUpdateControl={updateQualityControl}
        />
      </div>
    </div>
  )
}