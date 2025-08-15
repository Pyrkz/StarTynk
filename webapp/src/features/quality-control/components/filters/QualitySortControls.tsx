'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { SortConfig } from '../../types'

interface QualitySortControlsProps {
  sort: SortConfig
  onSortChange: (sort: SortConfig) => void
  className?: string
}

const sortOptions: Array<{ value: SortConfig['field']; label: string; icon: React.ReactNode }> = [
  { 
    value: 'date', 
    label: 'Data kontroli',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    value: 'score', 
    label: 'Ocena jakości',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )
  },
  { 
    value: 'completion', 
    label: 'Postęp',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    value: 'priority', 
    label: 'Priorytet',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    )
  },
  { 
    value: 'project', 
    label: 'Projekt',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  }
]

export const QualitySortControls: React.FC<QualitySortControlsProps> = ({
  sort,
  onSortChange,
  className
}) => {
  const handleFieldChange = (field: SortConfig['field']) => {
    if (field === sort.field) {
      // Toggle order if same field
      onSortChange({ field, order: sort.order === 'asc' ? 'desc' : 'asc' })
    } else {
      // Default to desc for new field
      onSortChange({ field, order: 'desc' })
    }
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="text-sm font-medium text-gray-700">Sortuj:</span>
      
      <select
        value={sort.field}
        onChange={(e) => handleFieldChange(e.target.value as SortConfig['field'])}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
      >
        {sortOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        onClick={() => onSortChange({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' })}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        title={sort.order === 'asc' ? 'Sortowanie rosnące' : 'Sortowanie malejące'}
      >
        <svg
          className={cn(
            'w-4 h-4 text-gray-600 transition-transform',
            sort.order === 'asc' ? 'rotate-180' : ''
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}