'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface QualityDateFilterProps {
  month?: number | 'all'
  year?: number | 'all'
  dateRange: {
    start: Date | null
    end: Date | null
  }
  onMonthChange: (month: number | 'all') => void
  onYearChange: (year: number | 'all') => void
  onDateRangeChange: (range: { start: Date | null; end: Date | null }) => void
  className?: string
}

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

export const QualityDateFilter: React.FC<QualityDateFilterProps> = ({
  month = 'all',
  year = 'all',
  dateRange,
  onMonthChange,
  onYearChange,
  onDateRangeChange,
  className
}) => {
  // Determine initial filter mode based on active filters
  const getInitialMode = (): FilterMode => {
    if (dateRange.start || dateRange.end) return 'range'
    if (month !== 'all' || year !== 'all') return 'month'
    return 'month'
  }
  
  const [filterMode, setFilterMode] = useState<FilterMode>(getInitialMode())
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // Update filter mode when props change (e.g., when filters are cleared)
  useEffect(() => {
    const newMode = getInitialMode()
    if (newMode !== filterMode) {
      setFilterMode(newMode)
    }
  }, [month, year, dateRange.start, dateRange.end])

  const handleModeChange = (mode: FilterMode) => {
    setFilterMode(mode)
    // Reset filters when changing mode
    if (mode === 'month') {
      onDateRangeChange({ start: null, end: null })
    } else if (mode === 'year') {
      onDateRangeChange({ start: null, end: null })
      onMonthChange('all')
    } else if (mode === 'range') {
      onMonthChange('all')
      onYearChange('all')
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
    <div className={cn('bg-white rounded-lg border border-neutral-200 p-4', className)}>
      <div className="space-y-4">
        {/* Filter mode selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-sm font-medium text-neutral-700 shrink-0">Filtruj według:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleModeChange('month')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
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
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
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
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                filterMode === 'range'
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              )}
            >
              Zakres dat
            </button>
          </div>
        </div>

        {/* Filter controls based on mode */}
        <div className="flex flex-col gap-3">
          {filterMode === 'month' && (
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={month === 'all' ? '' : month}
                onChange={(e) => onMonthChange(e.target.value ? Number(e.target.value) : 'all')}
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
                value={year === 'all' ? '' : year}
                onChange={(e) => onYearChange(e.target.value ? Number(e.target.value) : 'all')}
                className="w-full sm:w-auto min-w-[140px] px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
              >
                <option value="">Wszystkie lata</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterMode === 'year' && (
            <div className="flex">
              <select
                value={year === 'all' ? '' : year}
                onChange={(e) => onYearChange(e.target.value ? Number(e.target.value) : 'all')}
                className="w-full sm:w-auto min-w-[140px] px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
              >
                <option value="">Wszystkie lata</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterMode === 'range' && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm text-neutral-600 shrink-0 min-w-[30px]">Od:</label>
                <input
                  type="date"
                  value={formatDate(dateRange.start)}
                  onChange={(e) => onDateRangeChange({
                    start: parseDate(e.target.value),
                    end: dateRange.end
                  })}
                  className="w-full sm:w-auto px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm text-neutral-600 shrink-0 min-w-[30px]">Do:</label>
                <input
                  type="date"
                  value={formatDate(dateRange.end)}
                  onChange={(e) => onDateRangeChange({
                    start: dateRange.start,
                    end: parseDate(e.target.value)
                  })}
                  min={formatDate(dateRange.start)}
                  className="w-full sm:w-auto px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
                />
              </div>
            </div>
          )}

          {/* Clear button */}
          {((filterMode === 'month' && (month !== 'all' || year !== 'all')) ||
            (filterMode === 'year' && year !== 'all') ||
            (filterMode === 'range' && (dateRange.start || dateRange.end))) && (
            <div className="flex">
              <button
                onClick={() => {
                  if (filterMode === 'month') {
                    onMonthChange('all')
                    onYearChange('all')
                  } else if (filterMode === 'year') {
                    onYearChange('all')
                  } else {
                    onDateRangeChange({ start: null, end: null })
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-colors"
              >
                Wyczyść filtry dat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}