'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { QualityControlHistory, QualityAction, QualityStatus } from '@/types/quality-control'

interface QualityHistoryTimelineProps {
  history: QualityControlHistory[]
  currentStatus: QualityStatus
}

export const QualityHistoryTimeline: React.FC<QualityHistoryTimelineProps> = ({
  history,
  currentStatus
}) => {
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getActionLabel = (action: QualityAction): string => {
    switch (action) {
      case 'SUBMITTED':
        return 'Przesłano do kontroli'
      case 'REVIEWED':
        return 'Przeprowadzono kontrolę'
      case 'REJECTED':
        return 'Odrzucono'
      case 'PARTIALLY_APPROVED':
        return 'Częściowo zatwierdzono'
      case 'APPROVED':
        return 'Zatwierdzono'
      case 'CORRECTED':
        return 'Wprowadzono poprawki'
      case 'RESUBMITTED':
        return 'Ponownie przesłano'
      default:
        return action
    }
  }

  const getActionIcon = (action: QualityAction): string => {
    switch (action) {
      case 'SUBMITTED':
        return '📤'
      case 'REVIEWED':
        return '🔍'
      case 'REJECTED':
        return '❌'
      case 'PARTIALLY_APPROVED':
        return '⚠️'
      case 'APPROVED':
        return '✅'
      case 'CORRECTED':
        return '🔧'
      case 'RESUBMITTED':
        return '🔄'
      default:
        return '📋'
    }
  }

  const getActionColor = (action: QualityAction): string => {
    switch (action) {
      case 'SUBMITTED':
      case 'RESUBMITTED':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'REVIEWED':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'PARTIALLY_APPROVED':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'APPROVED':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'CORRECTED':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getUserRole = (action: QualityAction): string => {
    switch (action) {
      case 'SUBMITTED':
      case 'CORRECTED':
      case 'RESUBMITTED':
        return 'Wykonawca'
      case 'REVIEWED':
      case 'REJECTED':
      case 'PARTIALLY_APPROVED':
      case 'APPROVED':
        return 'Koordynator'
      default:
        return 'System'
    }
  }

  // Sort history by date (newest first)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime()
  )

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Historia zadania</h3>
      
      {sortedHistory.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-gray-400 text-3xl mb-2">📋</div>
          <p className="text-gray-600">Brak historii dla tego zadania</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedHistory.map((entry, index) => (
            <div key={entry.id} className="relative">
              {/* Timeline line */}
              {index < sortedHistory.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
              )}
              
              <div className="flex items-start gap-4">
                {/* Timeline icon */}
                <div className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full border-2 text-lg',
                  getActionColor(entry.action)
                )}>
                  {getActionIcon(entry.action)}
                </div>
                
                {/* Timeline content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {getActionLabel(entry.action)}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(entry.actionDate)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {getUserRole(entry.action)}
                    </span>
                    {entry.qualityScore !== undefined && entry.qualityScore > 0 && (
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        entry.qualityScore >= 80 
                          ? 'bg-green-100 text-green-700'
                          : entry.qualityScore >= 60
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      )}>
                        Ocena: {entry.qualityScore}%
                      </span>
                    )}
                    {entry.completionRate !== undefined && entry.completionRate > 0 && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        Ukończenie: {entry.completionRate}%
                      </span>
                    )}
                  </div>
                  
                  {entry.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-2">
                      {entry.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Status Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Aktualny status:
          </span>
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            currentStatus === 'APPROVED' 
              ? 'bg-green-100 text-green-700'
              : currentStatus === 'REJECTED'
                ? 'bg-red-100 text-red-700'
                : currentStatus === 'PARTIALLY_APPROVED'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-yellow-100 text-yellow-700'
          )}>
            {currentStatus === 'PENDING' && 'Oczekujące'}
            {currentStatus === 'APPROVED' && 'Zatwierdzone'}
            {currentStatus === 'REJECTED' && 'Odrzucone'}
            {currentStatus === 'PARTIALLY_APPROVED' && 'Częściowo zatwierdzone'}
          </span>
        </div>
      </div>
    </div>
  )
}