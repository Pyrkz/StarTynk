'use client'

import React from 'react'
import { Package, Clock, CheckCircle, TrendingUp, AlertTriangle, Euro, Calendar } from 'lucide-react'
import type { DeliveryStats } from '../../types'
import { formatCurrency } from '../../utils'

interface DeliveryStatsCardsProps {
  stats: DeliveryStats | null
  isLoading: boolean
}

export const DeliveryStatsCards: React.FC<DeliveryStatsCardsProps> = ({
  stats,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
              </div>
              <div className="w-16 h-8 bg-gray-300 rounded mb-2"></div>
              <div className="w-24 h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default stats to show when data is not yet loaded
  const defaultStats: DeliveryStats = {
    totalDeliveries: 0,
    pendingDeliveries: 0,
    scheduledDeliveries: 0,
    completedDeliveries: 0,
    totalValue: 0,
    averageDeliveryTime: 0,
    qualityIssueRate: 0,
    onTimeDeliveryRate: 0
  }

  const currentStats = stats || defaultStats

  const cards = [
    {
      title: 'Wszystkie dostawy',
      value: currentStats.totalDeliveries.toString(),
      icon: Package,
      color: 'blue',
      description: 'Łączna liczba dostaw'
    },
    {
      title: 'Oczekujące',
      value: currentStats.pendingDeliveries.toString(),
      icon: Clock,
      color: 'yellow',
      description: 'Dostawy oczekujące'
    },
    {
      title: 'Zaplanowane',
      value: currentStats.scheduledDeliveries.toString(),
      icon: Calendar,
      color: 'purple',
      description: 'Dostawy zaplanowane'
    },
    {
      title: 'Zakończone',
      value: currentStats.completedDeliveries.toString(),
      icon: CheckCircle,
      color: 'green',
      description: 'Dostawy zakończone'
    },
    {
      title: 'Łączna wartość',
      value: formatCurrency(currentStats.totalValue),
      icon: Euro,
      color: 'indigo',
      description: 'Wartość wszystkich dostaw'
    },
    {
      title: 'Punktualność',
      value: `${currentStats.onTimeDeliveryRate}%`,
      icon: TrendingUp,
      color: currentStats.onTimeDeliveryRate >= 90 ? 'green' : 
             currentStats.onTimeDeliveryRate >= 75 ? 'yellow' : 'red',
      description: 'Dostaw na czas'
    }
  ]

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600 bg-blue-50',
      yellow: 'text-yellow-600 bg-yellow-50',
      purple: 'text-purple-600 bg-purple-50',
      green: 'text-green-600 bg-green-50',
      indigo: 'text-indigo-600 bg-indigo-50',
      red: 'text-red-600 bg-red-50'
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        const colorClasses = getColorClasses(card.color)
        
        return (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${colorClasses}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              {/* Trend indicator could go here */}
              <div className="w-4 h-4"></div>
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-900">
                {card.value}
              </div>
              <div className="text-sm text-gray-600">
                {card.title}
              </div>
              <div className="text-xs text-gray-500">
                {card.description}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}