'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface QualityEmptyStateProps {
  hasFilters?: boolean
  onClearFilters?: () => void
  onNewControl?: () => void
  className?: string
}

export const QualityEmptyState: React.FC<QualityEmptyStateProps> = ({
  hasFilters = false,
  onClearFilters,
  onNewControl,
  className
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-6',
      className
    )}>
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-100 rounded-full animate-pulse" />
        <div className="absolute -bottom-1 -left-3 w-8 h-8 bg-amber-100 rounded-full animate-pulse animation-delay-300" />
        <div className="absolute top-8 -right-6 w-4 h-4 bg-emerald-100 rounded-full animate-pulse animation-delay-600" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {hasFilters ? 'Brak wyników' : 'Brak zadań do kontroli'}
      </h3>
      
      <p className="text-gray-600 text-center max-w-md mb-8">
        {hasFilters
          ? 'Nie znaleziono zadań spełniających wybrane kryteria. Spróbuj zmienić filtry lub wyczyść je, aby zobaczyć wszystkie zadania.'
          : 'Nie ma jeszcze żadnych zadań do kontroli jakości. Rozpocznij od dodania pierwszej kontroli.'}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        {hasFilters && onClearFilters && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Wyczyść filtry
          </Button>
        )}
        
        {onNewControl && (
          <Button
            variant="primary"
            onClick={onNewControl}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nowa kontrola
          </Button>
        )}
      </div>
    </div>
  )
}