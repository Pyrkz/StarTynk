'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { QualityBadge } from '../shared/QualityBadge'
import type { QualityControlStatus } from '../../types'

interface QualityStatusFilterProps {
  selectedStatus: QualityControlStatus | 'all'
  onStatusChange: (status: QualityControlStatus | 'all') => void
  counts: Record<string, number>
  className?: string
}

const statusOptions: Array<{ value: QualityControlStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'PENDING', label: 'Oczekujące' },
  { value: 'IN_REVIEW', label: 'W trakcie' },
  { value: 'APPROVED', label: 'Zatwierdzone' },
  { value: 'PARTIALLY_APPROVED', label: 'Częściowo' },
  { value: 'REJECTED', label: 'Odrzucone' }
]

export const QualityStatusFilter: React.FC<QualityStatusFilterProps> = ({
  selectedStatus,
  onStatusChange,
  counts,
  className
}) => {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {statusOptions.map(option => {
        const count = counts[option.value] || 0
        const isSelected = selectedStatus === option.value
        
        return (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium',
              'transition-all duration-200',
              'flex items-center gap-2',
              isSelected
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
            )}
          >
            
            <span className="relative">
              {option.label}
              {count > 0 && (
                <span className={cn(
                  'ml-1 text-xs font-medium',
                  isSelected ? 'text-gray-300' : 'text-gray-500'
                )}>
                  ({count})
                </span>
              )}
            </span>

          </button>
        )
      })}
    </div>
  )
}