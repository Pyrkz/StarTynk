// Financial Metrics Cards Component
// Display key financial KPI cards with trends and targets

import React from 'react';
import { 
  DollarSignIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BuildingIcon,
  BarChart3Icon,
  MinusIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import type { FinancialMetricsCard } from '@/types/finance';

interface FinancialMetricsCardsProps {
  metricsCards: FinancialMetricsCard[];
  loading: boolean;
}

const iconMap = {
  'dollar-sign': DollarSignIcon,
  'trending-up': TrendingUpIcon,
  'building': BuildingIcon,
  'bar-chart': BarChart3Icon,
} as const;

function getIconComponent(iconName: string) {
  return iconMap[iconName as keyof typeof iconMap] || DollarSignIcon;
}

function getTrendIcon(direction: 'up' | 'down' | 'neutral') {
  switch (direction) {
    case 'up':
      return TrendingUpIcon;
    case 'down':
      return TrendingDownIcon;
    default:
      return MinusIcon;
  }
}

function getTrendColor(direction: 'up' | 'down' | 'neutral', isPositive = true) {
  if (direction === 'neutral') return 'text-gray-500';
  
  // For revenue/profit, up is good. For expenses, down is good.
  const isGoodTrend = isPositive ? direction === 'up' : direction === 'down';
  return isGoodTrend ? 'text-green-600' : 'text-red-600';
}

function getTargetStatusColor(status: 'meeting' | 'exceeding' | 'below') {
  switch (status) {
    case 'exceeding':
      return 'text-green-600 bg-green-50';
    case 'meeting':
      return 'text-blue-600 bg-blue-50';
    case 'below':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function FinancialMetricsCards({ metricsCards, loading }: FinancialMetricsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-28"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (metricsCards.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Brak danych finansowych
          </h3>
          <p className="text-gray-600">
            Dane finansowe będą dostępne po przetworzeniu informacji z bazy danych.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsCards.map((card) => {
        const IconComponent = getIconComponent(card.icon);
        const TrendIcon = getTrendIcon(card.trend.direction);
        const isExpenseCard = card.id.includes('expense');
        const trendColor = getTrendColor(card.trend.direction, !isExpenseCard);

        return (
          <Card key={card.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              {/* Header with title and icon */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">
                  {card.title}
                </h3>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <IconComponent className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              {/* Main value */}
              <div className="mb-3">
                <p className="text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
              </div>

              {/* Trend indicator */}
              <div className={`flex items-center gap-1 mb-2 ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {Math.abs(card.trend.percentage).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">
                  {card.trend.period}
                </span>
              </div>

              {/* Breakdown information */}
              {card.breakdown && (
                <p className="text-xs text-gray-600 mb-2">
                  {card.breakdown}
                </p>
              )}

              {/* Target status (if available) */}
              {card.target && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  getTargetStatusColor(card.target.status)
                }`}>
                  <span>Target: {card.target.value}</span>
                  {card.target.status === 'exceeding' && '↗'}
                  {card.target.status === 'meeting' && '✓'}
                  {card.target.status === 'below' && '↘'}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default FinancialMetricsCards;