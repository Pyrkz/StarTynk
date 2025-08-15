import React from 'react'
import { ArrowUp, ArrowDown, ChevronDown } from 'lucide-react'

interface SortSelectProps {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortByChange: (value: string) => void
  onSortOrderChange: (value: 'asc' | 'desc') => void
  options: { value: string; label: string }[]
  loading?: boolean
}

export const SortSelect: React.FC<SortSelectProps> = ({
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onSortByChange,
  onSortOrderChange,
  options,
  loading,
}) => {
  return (
    <div className="w-full">
      <label className="sr-only">Sortuj po</label>
      <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden bg-white">
        <div className="relative flex-1">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full text-sm bg-transparent px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset transition-colors duration-150 appearance-none border-0"
            disabled={loading}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-neutral-500">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        <button
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-2 py-2 border-l border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset transition-colors duration-150"
          disabled={loading}
          aria-label={sortOrder === 'asc' ? 'Sortuj malejąco' : 'Sortuj rosnąco'}
        >
          {sortOrder === 'asc' ? (
            <ArrowUp className="h-4 w-4 text-neutral-600" />
          ) : (
            <ArrowDown className="h-4 w-4 text-neutral-600" />
          )}
        </button>
      </div>
    </div>
  )
}