'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { QUALITY_SCORE_OPTIONS, getQualityScoreColor, getQualityScoreBgColor } from '@/types/quality-control'

interface QualityScoreSelectorProps {
  selectedScore: number
  onScoreChange: (score: number) => void
  disabled?: boolean
}

export const QualityScoreSelector: React.FC<QualityScoreSelectorProps> = ({
  selectedScore,
  onScoreChange,
  disabled = false
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Ocena jakości wykonania
      </label>
      
      <div className="space-y-2">
        {QUALITY_SCORE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onScoreChange(option.value)}
            className={cn(
              'w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
              'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500',
              selectedScore === option.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed hover:border-gray-200 hover:shadow-none'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                  selectedScore === option.value
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                )}>
                  {selectedScore === option.value && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className={cn(
                  'font-semibold text-lg',
                  option.color
                )}>
                  {option.label}
                </span>
              </div>
              
              <div className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                getQualityScoreColor(option.value),
                getQualityScoreBgColor(option.value)
              )}>
                {option.value}%
              </div>
            </div>
            
            <p className="text-sm text-gray-600 ml-9">
              {option.description}
            </p>
          </button>
        ))}
      </div>

      {selectedScore > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Wybrana ocena:
            </span>
            <span className={cn(
              'text-lg font-bold',
              getQualityScoreColor(selectedScore)
            )}>
              {selectedScore}%
            </span>
          </div>
          
          {/* Visual quality bar */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={cn(
                  'h-3 rounded-full transition-all duration-500',
                  selectedScore >= 90 ? 'bg-green-500' :
                  selectedScore >= 80 ? 'bg-green-400' :
                  selectedScore >= 70 ? 'bg-yellow-500' :
                  selectedScore >= 50 ? 'bg-orange-500' :
                  'bg-red-500'
                )}
                style={{ width: `${selectedScore}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}