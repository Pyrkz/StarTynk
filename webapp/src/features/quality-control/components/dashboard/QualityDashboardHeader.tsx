'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface QualityDashboardHeaderProps {
  onNewControl?: () => void
  totalTasks?: number
  className?: string
}

export const QualityDashboardHeader: React.FC<QualityDashboardHeaderProps> = ({
  onNewControl,
  totalTasks = 0,
  className
}) => {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4', className)}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Kontrola jakości
        </h1>
        <p className="text-gray-600 mt-1 text-lg">
          Zarządzaj kontrolą jakości wykonanych prac
          {totalTasks > 0 && (
            <span className="text-gray-500 ml-2">
              • <span className="font-semibold">{totalTasks}</span> {totalTasks === 1 ? 'zadanie' : totalTasks < 5 ? 'zadania' : 'zadań'}
            </span>
          )}
        </p>
      </div>
      
      <Button
        variant="primary"
        onClick={onNewControl}
        className="flex items-center gap-2 shadow-lg shadow-blue-500/25"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nowa kontrola
      </Button>
    </div>
  )
}