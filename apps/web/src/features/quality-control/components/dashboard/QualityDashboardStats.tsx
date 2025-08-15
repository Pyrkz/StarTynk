'use client'

import React from 'react'
import { QualityStatsCard } from '../cards/QualityStatsCard'
import type { QualityControlStats } from '../../types'

interface QualityDashboardStatsProps {
  stats: QualityControlStats | null
  isLoading: boolean
}

export const QualityDashboardStats: React.FC<QualityDashboardStatsProps> = ({
  stats,
  isLoading
}) => {
  const statCards = [
    {
      title: 'Wszystkie zadania',
      value: stats?.totalTasks || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      variant: 'neutral' as const,
      subtitle: 'Łącznie w systemie'
    },
    {
      title: 'Zatwierdzone',
      value: stats?.approved || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      variant: 'success' as const,
      subtitle: 'Pozytywna ocena'
    },
    {
      title: 'Częściowo zatwierdzone',
      value: stats?.partiallyApproved || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      variant: 'warning' as const,
      subtitle: 'Wymaga poprawek'
    },
    {
      title: 'Oczekujące',
      value: stats?.pendingReview || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      variant: 'primary' as const,
      subtitle: 'Do przeglądu'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <QualityStatsCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          variant={card.variant}
          subtitle={card.subtitle}
          loading={isLoading}
        />
      ))}
    </div>
  )
}