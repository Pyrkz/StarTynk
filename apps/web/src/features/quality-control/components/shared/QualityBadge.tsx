'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { QualityControlStatus, Priority } from '../../types'
import { 
  getStatusColor, 
  getStatusBgColor, 
  getPriorityColor, 
  getPriorityBgColor 
} from '../../types'

interface QualityBadgeProps {
  type: 'status' | 'priority' | 'score'
  value: QualityControlStatus | Priority | number
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({
  type,
  value,
  size = 'md',
  showIcon = true,
  className
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  const getIcon = () => {
    if (!showIcon) return null

    if (type === 'status') {
      const icons: Record<QualityControlStatus, string> = {
        PENDING: '⏳',
        APPROVED: '✅',
        REJECTED: '❌',
        PARTIALLY_APPROVED: '⚠️',
        IN_REVIEW: '🔍'
      }
      return icons[value as QualityControlStatus]
    }

    if (type === 'priority') {
      const icons: Record<Priority, string> = {
        URGENT: '🔴',
        HIGH: '🟠',
        MEDIUM: '🟡',
        LOW: '🟢'
      }
      return icons[value as Priority]
    }

    if (type === 'score') {
      const score = value as number
      if (score >= 90) return '🏆'
      if (score >= 75) return '👍'
      if (score >= 60) return '⚠️'
      return '👎'
    }

    return null
  }

  const getLabel = () => {
    if (type === 'status') {
      const labels: Record<QualityControlStatus, string> = {
        PENDING: 'Oczekujące',
        APPROVED: 'Zatwierdzone',
        REJECTED: 'Odrzucone',
        PARTIALLY_APPROVED: 'Częściowo zatwierdzone',
        IN_REVIEW: 'W trakcie przeglądu'
      }
      return labels[value as QualityControlStatus]
    }

    if (type === 'priority') {
      const labels: Record<Priority, string> = {
        URGENT: 'Pilne',
        HIGH: 'Wysoki',
        MEDIUM: 'Średni',
        LOW: 'Niski'
      }
      return labels[value as Priority]
    }

    if (type === 'score') {
      return `${value}%`
    }

    return String(value)
  }

  const getColorClasses = () => {
    if (type === 'status') {
      return cn(
        getStatusColor(value as QualityControlStatus),
        getStatusBgColor(value as QualityControlStatus)
      )
    }

    if (type === 'priority') {
      return cn(
        getPriorityColor(value as Priority),
        getPriorityBgColor(value as Priority)
      )
    }

    if (type === 'score') {
      const score = value as number
      if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      if (score >= 75) return 'text-blue-700 bg-blue-50 border-blue-200'
      if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200'
      return 'text-red-700 bg-red-50 border-red-200'
    }

    return 'text-gray-700 bg-gray-50 border-gray-200'
  }

  const icon = getIcon()
  const label = getLabel()

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium border',
        'transition-all duration-200',
        sizeClasses[size],
        getColorClasses(),
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  )
}