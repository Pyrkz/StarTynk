import React from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Calendar, 
  Building2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdvancedFiltersProps } from './AdvancedFilters.types'

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onToggle,
  developerId,
  onDeveloperChange,
  dateRange,
  onDateRangeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onReset,
  developers,
  isLoading
}) => {
  const activeFiltersCount = [
    developerId,
    dateRange,
    sortBy !== 'name' || sortOrder !== 'asc'
  ].filter(Boolean).length

  const sortOptions = [
    { value: 'name', label: 'Nazwa' },
    { value: 'startDate', label: 'Data rozpoczęcia' },
    { value: 'endDate', label: 'Data zakończenia' },
    { value: 'status', label: 'Status' },
    { value: 'progress', label: 'Postęp' },
    { value: 'developer', label: 'Deweloper' },
    { value: 'value', label: 'Wartość' }
  ]

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-elevation-low">
      <button
        onClick={onToggle}
        className={cn(
          'w-full px-6 py-4 flex items-center justify-between',
          'text-left transition-colors duration-200',
          'hover:bg-neutral-50 focus:outline-none focus:bg-neutral-50',
          'group'
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-neutral-600" />
          <span className="font-semibold text-neutral-900">Filtry zaawansowane</span>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-medium">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-neutral-200">
          {isLoading ? (
            <div className="py-8 text-center text-neutral-500">
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                Ładowanie...
              </div>
            </div>
          ) : (
            <div className="pt-6 space-y-6">
              {/* Developer Filter */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Deweloper
                </label>
                <select
                  value={developerId || ''}
                  onChange={(e) => onDeveloperChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
                  aria-label="Deweloper"
                  disabled={isLoading}
                >
                  <option value="">Wszyscy deweloperzy</option>
                  {developers.map(dev => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Zakres dat
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={dateRange?.start ? formatDateForInput(dateRange.start) : ''}
                    onChange={(e) => {
                      const newDate = e.target.value ? new Date(e.target.value) : undefined
                      if (newDate) {
                        onDateRangeChange({
                          start: newDate,
                          end: dateRange?.end || newDate
                        })
                      } else {
                        onDateRangeChange(undefined)
                      }
                    }}
                    className="px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
                    placeholder="Od"
                    disabled={isLoading}
                  />
                  <input
                    type="date"
                    value={dateRange?.end ? formatDateForInput(dateRange.end) : ''}
                    onChange={(e) => {
                      const newDate = e.target.value ? new Date(e.target.value) : undefined
                      if (newDate && dateRange?.start) {
                        onDateRangeChange({
                          start: dateRange.start,
                          end: newDate
                        })
                      }
                    }}
                    className="px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
                    placeholder="Do"
                    disabled={isLoading || !dateRange?.start}
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <ArrowUpDown className="w-4 h-4 inline mr-2" />
                  Sortowanie
                </label>
                <div className="space-y-3">
                  <select
                    value={sortBy}
                    onChange={(e) => onSortByChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
                    aria-label="Sortuj według"
                    disabled={isLoading}
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSortOrderChange('asc')}
                      className={cn(
                        'flex-1 px-4 py-2.5 rounded-lg border font-medium transition-all duration-200',
                        'flex items-center justify-center gap-2',
                        sortOrder === 'asc'
                          ? 'bg-primary-500 text-white border-primary-500 shadow-elevation-low'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                      )}
                      disabled={isLoading}
                      aria-label="Sortuj rosnąco"
                    >
                      <ArrowUp className="w-4 h-4" />
                      Rosnąco
                    </button>
                    <button
                      onClick={() => onSortOrderChange('desc')}
                      className={cn(
                        'flex-1 px-4 py-2.5 rounded-lg border font-medium transition-all duration-200',
                        'flex items-center justify-center gap-2',
                        sortOrder === 'desc'
                          ? 'bg-primary-500 text-white border-primary-500 shadow-elevation-low'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                      )}
                      disabled={isLoading}
                      aria-label="Sortuj malejąco"
                    >
                      <ArrowDown className="w-4 h-4" />
                      Malejąco
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={onReset}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border border-neutral-300',
                    'bg-white text-neutral-700 font-medium',
                    'hover:bg-neutral-50 hover:border-neutral-400',
                    'transition-colors duration-200',
                    'flex items-center justify-center gap-2'
                  )}
                  disabled={isLoading}
                >
                  <RotateCcw className="w-4 h-4" />
                  Resetuj filtry
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}