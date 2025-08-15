'use client'

import React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { getStatusColor, getStatusBgColor, getQualityScoreColor, getQualityScoreBgColor } from '@/types/quality-control'
import type { QualityControl } from '@/types/quality-control'

interface QualityTaskCardProps {
  qualityControl: QualityControl
}

export const QualityTaskCard: React.FC<QualityTaskCardProps> = ({
  qualityControl
}) => {
  const { task, status, qualityScore, completionRate, controlDate, notes } = qualityControl

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Oczekujące'
      case 'APPROVED':
        return 'Zatwierdzone'
      case 'REJECTED':
        return 'Odrzucone'
      case 'PARTIALLY_APPROVED':
        return 'Częściowo zatwierdzone'
      default:
        return status
    }
  }

  const assignedUser = task.assignments?.[0]?.user

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {task.title}
            </h3>
            <Badge
              variant={
                status === 'APPROVED' ? 'success' :
                status === 'REJECTED' ? 'error' :
                status === 'PARTIALLY_APPROVED' ? 'warning' :
                'neutral'
              }
              className={cn(
                'font-medium',
                getStatusColor(status),
                getStatusBgColor(status)
              )}
            >
              {getStatusLabel(status)}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">ID zadania:</span> {task.id}</p>
            <p><span className="font-medium">Projekt:</span> {task.project.name}</p>
            {assignedUser && (
              <p><span className="font-medium">Wykonawca:</span> {assignedUser.name}</p>
            )}
            <p><span className="font-medium">Data kontroli:</span> {formatDate(controlDate)}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {status !== 'PENDING' && (
            <div className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              getQualityScoreColor(qualityScore),
              getQualityScoreBgColor(qualityScore)
            )}>
              Jakość: {qualityScore}%
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            Ukończenie: <span className="font-medium">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Postęp wykonania</span>
          <span>{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              completionRate === 100 ? 'bg-green-500' :
              completionRate >= 80 ? 'bg-blue-500' :
              completionRate >= 60 ? 'bg-yellow-500' :
              'bg-red-500'
            )}
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Uwagi:</span> {notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Link href={`/dashboard/kontrola-jakosci/${task.id}`}>
          <Button variant="ghost" size="sm">
            Zobacz szczegóły →
          </Button>
        </Link>
      </div>
    </div>
  )
}