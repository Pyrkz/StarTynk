'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProjects } from '@/features/projekty/hooks'
import { ProjectFilters, ProjectStatus } from '@/features/projekty/types'
import { PROJECT_STATUS_OPTIONS } from '@/features/projekty/constants'
import {
  ProjectsHeader,
  ProjectsToolbar,
  ProjectsPagination,
  FiltersContainer,
  ProjectsGrid,
  LoadingState,
  EmptyState,
  ErrorState,
  ViewMode
} from '@/features/projects/components'

export default function ProjectsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [filters] = useState<ProjectFilters>({})
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('projects-view-mode') as ViewMode
    if (savedViewMode && ['grid', 'list'].includes(savedViewMode)) {
      setViewMode(savedViewMode)
    }
  }, [])

  // Save view mode to localStorage when it changes
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('projects-view-mode', mode)
  }

  const { projects, loading, error, pagination, refetch } = useProjects({
    page,
    limit: 10,
    filters: {
      ...filters,
      search: searchValue,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    },
  })

  const handleAddProject = () => {
    router.push('/dashboard/projekty/dodaj-projekt')
  }

  const handleFilter = () => {
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearchValue('')
    setStatusFilter('ALL')
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const statusOptions = [
    { value: 'ALL' as const, label: 'Wszystkie statusy' },
    ...PROJECT_STATUS_OPTIONS.map(option => ({
      ...option,
      color: option.value === 'ACTIVE' ? 'bg-success-500' : 
             option.value === 'PLANNING' ? 'bg-warning-500' :
             option.value === 'COMPLETED' ? 'bg-neutral-500' :
             option.value === 'ON_HOLD' ? 'bg-error-500' : undefined
    }))
  ]

  const hasActiveFilters = searchValue !== '' || statusFilter !== 'ALL'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ProjectsHeader
          title="Projekty"
          totalCount={pagination?.total}
          onAddProject={handleAddProject}
        />
        <ProjectsToolbar
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onRefresh={refetch}
          isLoading={loading}
        />
      </div>

      {/* Filters Section */}
      <FiltersContainer
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={statusOptions}
        onFilter={handleFilter}
        isLoading={loading}
      />

      {/* Content Section */}
      <div className="min-h-[400px]">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : loading ? (
          <LoadingState itemCount={6} viewMode={viewMode} />
        ) : projects.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            onAddProject={handleAddProject}
            onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
          />
        ) : (
          <>
            <ProjectsGrid projects={projects} />
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8">
                <ProjectsPagination
                  currentPage={page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}