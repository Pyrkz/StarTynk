'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface QualityStatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  subtitle?: string
  loading?: boolean
}

export const QualityStatsCard: React.FC<QualityStatsCardProps> = ({
  title,
  value,
  icon,
  variant = 'neutral',
  subtitle,
  loading = false
}) => {
  const variantStyles = {
    primary: {
      icon: 'bg-primary-100 text-primary-600'
    },
    success: {
      icon: 'bg-success-100 text-success-600'
    },
    warning: {
      icon: 'bg-warning-100 text-warning-600'
    },
    error: {
      icon: 'bg-error-100 text-error-600'
    },
    neutral: {
      icon: 'bg-neutral-100 text-neutral-600'
    }
  }

  const styles = variantStyles[variant]

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </p>
          
          <p className="text-2xl font-semibold text-gray-900">
            {value}
          </p>

          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className={cn(
          'flex items-center justify-center w-12 h-12 rounded-lg',
          styles.icon
        )}>
          {icon}
        </div>
      </div>
    </div>
  )
}