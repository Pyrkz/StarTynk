import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  itemCount?: number
  viewMode?: 'grid' | 'list'
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  itemCount = 6,
  viewMode = 'grid',
  className
}) => {
  if (viewMode === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: itemCount }, (_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-elevation-low p-4 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-5 bg-neutral-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-neutral-200 rounded w-1/2" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-24 bg-neutral-200 rounded-full" />
                <div className="h-4 w-32 bg-neutral-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-6', className)}>
      {Array.from({ length: itemCount }, (_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-elevation-low p-6 animate-pulse"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
            </div>
            <div className="h-8 w-24 bg-neutral-200 rounded-full" />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center gap-2">
                <div className="w-4 h-4 bg-neutral-200 rounded" />
                <div className="h-4 bg-neutral-200 rounded flex-1" />
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between mb-1">
              <div className="h-3 bg-neutral-200 rounded w-24" />
              <div className="h-3 bg-neutral-200 rounded w-12" />
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2" />
          </div>
        </div>
      ))}
    </div>
  )
}