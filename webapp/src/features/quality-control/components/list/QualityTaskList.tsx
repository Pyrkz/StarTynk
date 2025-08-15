'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { QualityTaskListItem } from './QualityTaskListItem'
import { QualityEmptyState } from './QualityEmptyState'
import type { QualityControl } from '../../types'

interface QualityTaskListProps {
  qualityControls: QualityControl[]
  isLoading: boolean
  hasFilters?: boolean
  onClearFilters?: () => void
  onNewControl?: () => void
  onUpdateControl?: (id: string, updates: Partial<QualityControl>) => void
  className?: string
}

export const QualityTaskList: React.FC<QualityTaskListProps> = ({
  qualityControls,
  isLoading,
  hasFilters = false,
  onClearFilters,
  onNewControl,
  onUpdateControl,
  className
}) => {
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="h-10 bg-gray-100 rounded"></div>
                  <div className="h-10 bg-gray-100 rounded"></div>
                  <div className="h-10 bg-gray-100 rounded"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded-full w-full"></div>
              </div>
              <div className="w-20 h-7 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (qualityControls.length === 0) {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
        <QualityEmptyState
          hasFilters={hasFilters}
          onClearFilters={onClearFilters}
          onNewControl={onNewControl}
        />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* List header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Zadania do kontroli
          </h2>
          <span className="text-sm text-gray-600">
            {qualityControls.length} {qualityControls.length === 1 ? 'zadanie' : 'zadań'}
          </span>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {qualityControls.map((control) => (
          <QualityTaskListItem
            key={control.id}
            qualityControl={control}
            onUpdate={onUpdateControl}
          />
        ))}
      </div>

      {/* Load more */}
      {qualityControls.length >= 10 && (
        <div className="text-center">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200">
            Załaduj więcej zadań
          </button>
        </div>
      )}
    </div>
  )
}