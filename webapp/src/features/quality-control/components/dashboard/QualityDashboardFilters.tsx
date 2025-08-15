'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { QualityStatusFilter } from '../filters/QualityStatusFilter'
import { QualitySortControls } from '../filters/QualitySortControls'
import { QualitySearchBar } from '../filters/QualitySearchBar'
import type { QualityFilters, SortConfig } from '../../types'

type FilterMode = 'month' | 'year' | 'range'

const months = [
  { value: 1, label: 'Styczeń' },
  { value: 2, label: 'Luty' },
  { value: 3, label: 'Marzec' },
  { value: 4, label: 'Kwiecień' },
  { value: 5, label: 'Maj' },
  { value: 6, label: 'Czerwiec' },
  { value: 7, label: 'Lipiec' },
  { value: 8, label: 'Sierpień' },
  { value: 9, label: 'Wrzesień' },
  { value: 10, label: 'Październik' },
  { value: 11, label: 'Listopad' },
  { value: 12, label: 'Grudzień' }
]

interface QualityDashboardFiltersProps {
  filters: QualityFilters
  sort: SortConfig
  filterCounts: Record<string, number>
  activeFiltersCount: number
  onFiltersChange: (filters: Partial<QualityFilters>) => void
  onSortChange: (sort: SortConfig) => void
  onClearFilters: () => void
  className?: string
}

export const QualityDashboardFilters: React.FC<QualityDashboardFiltersProps> = ({
  filters,
  sort,
  filterCounts,
  activeFiltersCount,
  onFiltersChange,
  onSortChange,
  onClearFilters,
  className
}) => {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  
  // Determine filter mode based on active filters
  const getInitialMode = (): FilterMode => {
    if (filters.dateRange.start || filters.dateRange.end) return 'range'
    if (filters.month !== 'all' || filters.year !== 'all') return 'month'
    return 'month'
  }
  
  const [filterMode, setFilterMode] = useState<FilterMode>(getInitialMode())
  
  // Update filter mode when props change
  useEffect(() => {
    const newMode = getInitialMode()
    if (newMode !== filterMode) {
      setFilterMode(newMode)
    }
  }, [filters.month, filters.year, filters.dateRange.start, filters.dateRange.end])
  
  const handleModeChange = (mode: FilterMode) => {
    setFilterMode(mode)
    // Reset filters when changing mode
    if (mode === 'month') {
      onFiltersChange({ dateRange: { start: null, end: null } })
    } else if (mode === 'year') {
      onFiltersChange({ dateRange: { start: null, end: null }, month: 'all' })
    } else if (mode === 'range') {
      onFiltersChange({ month: 'all', year: 'all' })
    }
  }
  
  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }
  
  const parseDate = (dateString: string) => {
    return dateString ? new Date(dateString) : null
  }

  return (
    <div className={cn('bg-white rounded-lg border border-neutral-200', className)}>
      {/* Header */}
      <div className="p-6 pb-4 border-b border-neutral-100">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-neutral-900 mb-1">Filtry i wyszukiwanie</h2>
            {activeFiltersCount > 0 && (
              <p className="text-sm text-neutral-600">
                Aktywne filtry: <span className="font-medium">{activeFiltersCount}</span>
                <button
                  onClick={onClearFilters}
                  className="ml-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Wyczyść wszystkie
                </button>
              </p>
            )}
          </div>
          
          <div className="flex-1 max-w-lg">
            <QualitySearchBar
              value={filters.search}
              onChange={(search) => onFiltersChange({ search })}
            />
          </div>
        </div>
      </div>

      {/* Filters content */}
      <div className="p-6 space-y-6">
        {/* Date filters */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <span className="text-sm font-medium text-neutral-700">Data kontroli:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleModeChange('month')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  filterMode === 'month'
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                )}
              >
                Miesiąc
              </button>
              <button
                onClick={() => handleModeChange('year')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  filterMode === 'year'
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                )}
              >
                Rok
              </button>
              <button
                onClick={() => handleModeChange('range')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  filterMode === 'range'
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                )}
              >
                Zakres dat
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {filterMode === 'month' && (
              <>
                <select
                  value={filters.month === 'all' ? '' : filters.month}
                  onChange={(e) => onFiltersChange({ month: e.target.value ? Number(e.target.value) : 'all' })}
                  className="w-full sm:w-auto min-w-[180px] px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
                >
                  <option value="">Wszystkie miesiące</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                
                <select
                  value={filters.year === 'all' ? '' : filters.year}
                  onChange={(e) => onFiltersChange({ year: e.target.value ? Number(e.target.value) : 'all' })}
                  className="w-full sm:w-auto min-w-[140px] px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
                >
                  <option value="">Wszystkie lata</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}

            {filterMode === 'year' && (
              <select
                value={filters.year === 'all' ? '' : filters.year}
                onChange={(e) => onFiltersChange({ year: e.target.value ? Number(e.target.value) : 'all' })}
                className="w-full sm:w-auto min-w-[140px] px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
              >
                <option value="">Wszystkie lata</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}

            {filterMode === 'range' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-neutral-600">Od:</label>
                  <input
                    type="date"
                    value={formatDate(filters.dateRange.start)}
                    onChange={(e) => onFiltersChange({ 
                      dateRange: { ...filters.dateRange, start: parseDate(e.target.value) }
                    })}
                    className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-neutral-600">Do:</label>
                  <input
                    type="date"
                    value={formatDate(filters.dateRange.end)}
                    onChange={(e) => onFiltersChange({ 
                      dateRange: { ...filters.dateRange, end: parseDate(e.target.value) }
                    })}
                    min={formatDate(filters.dateRange.start)}
                    className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status and sort filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-neutral-700 shrink-0">Status kontroli:</span>
            <QualityStatusFilter
              selectedStatus={filters.status}
              onStatusChange={(status) => onFiltersChange({ status })}
              counts={filterCounts}
            />
          </div>

          <QualitySortControls
            sort={sort}
            onSortChange={onSortChange}
          />
        </div>
      </div>
    </div>
  )
}