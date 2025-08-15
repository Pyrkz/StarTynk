'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { QualityControl } from '../../types'

interface QualityTaskListItemProps {
  qualityControl: QualityControl
  onUpdate?: (id: string, updates: Partial<QualityControl>) => void
  className?: string
}

export const QualityTaskListItem: React.FC<QualityTaskListItemProps> = ({
  qualityControl,
  onUpdate,
  className
}) => {
  const { task, status, qualityScore, completionRate, controlDate, notes, controller } = qualityControl

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getProgressColor = (rate: number) => {
    if (rate === 100) return 'bg-success-500'
    if (rate === 80) return 'bg-primary-500'
    if (rate === 70) return 'bg-warning-500'
    if (rate === 50) return 'bg-secondary-500'
    return 'bg-neutral-300'
  }

  const getProgressTextColor = (rate: number) => {
    if (rate === 100) return 'text-success-700'
    if (rate === 80) return 'text-primary-700'
    if (rate === 70) return 'text-warning-700'
    if (rate === 50) return 'text-secondary-700'
    return 'text-neutral-500'
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'Oczekujące'
      case 'IN_REVIEW': return 'W trakcie'
      case 'APPROVED': return 'Zatwierdzone'
      case 'REJECTED': return 'Odrzucone'
      case 'PARTIALLY_APPROVED': return 'Częściowo'
      default: return status
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-neutral-50 text-neutral-700 border-neutral-200'
      case 'IN_REVIEW': return 'bg-primary-50 text-primary-700 border-primary-200'
      case 'APPROVED': return 'bg-success-50 text-success-700 border-success-200'
      case 'REJECTED': return 'bg-error-50 text-error-700 border-error-200'
      case 'PARTIALLY_APPROVED': return 'bg-warning-50 text-warning-700 border-warning-200'
      default: return 'bg-neutral-50 text-neutral-700 border-neutral-200'
    }
  }

  const assignedUser = task.assignments?.[0]?.user

  return (
    <div className={cn(
      'bg-white border border-neutral-200 rounded-lg hover:shadow-md transition-shadow duration-200',
      className
    )}>
      <div className="p-5">
        {/* Header with title and status */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-neutral-900 truncate mb-1">
              {task.title}
            </h3>
            <p className="text-sm text-neutral-600">
              {task.project.name}
              {task.project.location && (
                <span className="text-gray-500"> • {task.project.location}</span>
              )}
            </p>
          </div>
          
          <span className={cn(
            'px-3 py-1 text-xs font-medium rounded-full shrink-0 border',
            getStatusStyle(status)
          )}>
            {getStatusLabel(status)}
          </span>
        </div>

        {/* Meta information grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {assignedUser && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Wykonawca</p>
                <p className="text-sm font-medium text-neutral-900">{assignedUser.name}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Data kontroli</p>
              <p className="text-sm font-medium text-neutral-900">{formatDate(controlDate)}</p>
            </div>
          </div>

          {controller && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Kontroler</p>
                <p className="text-sm font-medium text-neutral-900">{controller.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar with percentage */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-neutral-700">Postęp wykonania</span>
            <span className={cn('text-sm font-semibold', getProgressTextColor(completionRate))}>
              {completionRate}%
            </span>
          </div>
          <div className="relative">
            {/* Progress bar background */}
            <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
              <div
                className={cn('h-3 rounded-full transition-all duration-500 ease-out', getProgressColor(completionRate))}
                style={{ width: `${completionRate}%` }}
              />
            </div>
            
            {/* Progress milestones */}
            <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-xs text-neutral-400">
              <span>0%</span>
              <span className="absolute" style={{ left: '50%', transform: 'translateX(-50%)' }}>50%</span>
              <span className="absolute" style={{ left: '70%', transform: 'translateX(-50%)' }}>70%</span>
              <span className="absolute" style={{ left: '80%', transform: 'translateX(-50%)' }}>80%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end pt-3 border-t border-neutral-100">
          <Link href={`/dashboard/kontrola-jakosci/${task.id}`}>
            <button className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors duration-200 flex items-center gap-1">
              Szczegóły
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Link>
        </div>
      </div>

    </div>
  )
}