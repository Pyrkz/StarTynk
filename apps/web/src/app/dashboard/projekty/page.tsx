'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useProjects } from '@/features/projekty/hooks'
import { ProjectFilters, ProjectStatus } from '@/features/projekty/types'
import { PROJECT_STATUS_OPTIONS } from '@/features/projekty/constants'
import { ProjectMetrics } from '@/features/projects/types'
import {
  ProjectsHeader,
  ProjectsToolbar,
  ProjectsPagination,
  FiltersContainer,
  AdvancedFilters,
  ProjectsGrid,
  ProjectsList,
  ProjectsStats,
  LoadingState,
  EmptyState,
  ErrorState,
  ViewMode
} from '@/features/projects/components'

export default function ProjectsPage() {
  const router = useRouter()
  
  // State management
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [filters] = useState<ProjectFilters>({})
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL')
  const [developerId, setDeveloperId] = useState<string>('')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>()
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Load preferences from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('projects-view-mode') as ViewMode
    if (savedViewMode && ['grid', 'list'].includes(savedViewMode)) {
      setViewMode(savedViewMode)
    }

    const savedPageSize = localStorage.getItem('projects-page-size')
    if (savedPageSize) {
      setPageSize(parseInt(savedPageSize, 10))
    }
  }, [])

  // Save view mode preference
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('projects-view-mode', mode)
  }

  // Save page size preference
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
    localStorage.setItem('projects-page-size', size.toString())
  }

  // Fetch projects data
  const { projects, loading, error, pagination, refetch } = useProjects({
    page,
    limit: pageSize,
    filters: {
      ...filters,
      search: searchValue,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      developerId: developerId || undefined,
      dateRange,
      sortBy,
      sortOrder
    },
  })

  // Calculate metrics
  const metrics: ProjectMetrics = useMemo(() => {
    if (!projects.length) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        totalValue: 0,
        averageProgress: 0,
        upcomingDeadlines: 0
      }
    }

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return {
      totalProjects: pagination?.total || projects.length,
      activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
      completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
      onHoldProjects: projects.filter(p => p.status === 'ON_HOLD').length,
      totalValue: projects.reduce((sum, p) => sum + (p.value || 0), 0),
      averageProgress: Math.round(
        projects
          .filter(p => p.status === 'ACTIVE')
          .reduce((sum, p) => {
            const start = new Date(p.startDate)
            const end = new Date(p.endDate)
            const totalDays = Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 1)
            const daysElapsed = Math.max((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0)
            return sum + Math.min((daysElapsed / totalDays) * 100, 100)
          }, 0) / projects.filter(p => p.status === 'ACTIVE').length || 0
      ),
      upcomingDeadlines: projects.filter(p => {
        const endDate = new Date(p.endDate)
        return p.status === 'ACTIVE' && endDate >= now && endDate <= thirtyDaysFromNow
      }).length
    }
  }, [projects, pagination])

  // Mock developers data (replace with actual API call)
  const developers = [
    { id: '1', name: 'Deweloper A' },
    { id: '2', name: 'Deweloper B' },
    { id: '3', name: 'Deweloper C' }
  ]

  // Handlers
  const handleAddProject = () => {
    router.push('/dashboard/projekty/dodaj-projekt')
  }

  const handleFilter = () => {
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearchValue('')
    setStatusFilter('ALL')
    setDeveloperId('')
    setDateRange(undefined)
    setSortBy('name')
    setSortOrder('asc')
    setPage(1)
  }

  const handleResetAdvancedFilters = () => {
    setDeveloperId('')
    setDateRange(undefined)
    setSortBy('name')
    setSortOrder('asc')
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProjectClick = (project: any) => {
    router.push(`/dashboard/projekty/${project.id}`)
  }

  // Status options with styling
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

  const hasActiveFilters = searchValue !== '' || 
                          statusFilter !== 'ALL' || 
                          developerId !== '' || 
                          dateRange !== undefined ||
                          sortBy !== 'name' ||
                          sortOrder !== 'asc'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Statistics Section */}
      <ProjectsStats metrics={metrics} isLoading={loading} />

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
      <div className="space-y-4">
        <FiltersContainer
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={statusOptions}
          onFilter={handleFilter}
          isLoading={loading}
        />
        
        {/* Advanced Filters */}
        <AdvancedFilters
          isOpen={showAdvancedFilters}
          onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
          developerId={developerId}
          onDeveloperChange={setDeveloperId}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          onReset={handleResetAdvancedFilters}
          developers={developers}
          isLoading={loading}
        />
      </div>

      {/* Content Section */}
      <div className="min-h-[600px]">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : loading ? (
          <LoadingState itemCount={pageSize} viewMode={viewMode} />
        ) : projects.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            onAddProject={handleAddProject}
            onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
          />
        ) : (
          <>
            {viewMode === 'grid' ? (
              <ProjectsGrid projects={projects} />
            ) : (
              <ProjectsList 
                projects={projects}
                onProjectClick={handleProjectClick}
                showColumns={{
                  developer: true,
                  dates: true,
                  status: true,
                  progress: true,
                  value: true,
                  actions: true
                }}
              />
            )}
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8">
                <ProjectsPagination
                  currentPage={page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                  totalItems={pagination.total}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}