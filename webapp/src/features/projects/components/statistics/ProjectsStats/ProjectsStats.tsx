import React from 'react'
import { 
  Briefcase, 
  TrendingUp, 
  CheckCircle2, 
  PauseCircle, 
  Banknote,
  Clock,
  AlertTriangle 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProjectsStatsProps } from './ProjectsStats.types'

export const ProjectsStats: React.FC<ProjectsStatsProps> = ({
  metrics,
  isLoading,
  className
}) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${Math.round(value / 1000000)} mln zł`
    }
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const stats = [
    {
      label: 'Wszystkie projekty',
      value: metrics.totalProjects,
      icon: Briefcase,
      color: 'primary',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600'
    },
    {
      label: 'Aktywne',
      value: metrics.activeProjects,
      icon: TrendingUp,
      color: 'success',
      bgColor: 'bg-success-50',
      iconColor: 'text-success-600'
    },
    {
      label: 'Ukończone',
      value: metrics.completedProjects,
      icon: CheckCircle2,
      color: 'neutral',
      bgColor: 'bg-neutral-100',
      iconColor: 'text-neutral-600'
    },
    {
      label: 'Wstrzymane',
      value: metrics.onHoldProjects,
      icon: PauseCircle,
      color: 'error',
      bgColor: 'bg-error-50',
      iconColor: 'text-error-600'
    },
    {
      label: 'Wartość projektów',
      value: formatCurrency(metrics.totalValue),
      icon: Banknote,
      color: 'primary',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      isLarge: true
    },
    {
      label: 'Średni postęp',
      value: `${metrics.averageProgress}%`,
      icon: Clock,
      color: 'secondary',
      bgColor: 'bg-secondary-50',
      iconColor: 'text-secondary-600'
    },
    {
      label: 'Zbliżające się terminy',
      value: metrics.upcomingDeadlines,
      icon: AlertTriangle,
      color: 'warning',
      bgColor: 'bg-warning-50',
      iconColor: 'text-warning-600',
      highlight: metrics.upcomingDeadlines > 0
    }
  ]

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            data-testid="stats-skeleton"
            className={cn(
              'bg-white rounded-xl p-4 border border-neutral-200',
              'shadow-elevation-low',
              index === 4 && 'md:col-span-2'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-200 animate-pulse" />
              <div className="w-16 h-6 rounded bg-neutral-200 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="w-24 h-4 rounded bg-neutral-200 animate-pulse" />
              <div className="w-32 h-7 rounded bg-neutral-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className={cn(
              'bg-white rounded-xl p-4 border transition-all duration-300',
              'shadow-elevation-low hover:shadow-elevation-medium',
              stat.isLarge && 'md:col-span-2',
              stat.highlight ? 'border-warning-200' : 'border-neutral-200',
              'group cursor-default'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                'transition-transform duration-300 group-hover:scale-110',
                stat.bgColor
              )}>
                <Icon className={cn('w-5 h-5', stat.iconColor)} />
              </div>
              {stat.highlight && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
                  Uwaga
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">{stat.label}</p>
              <p className={cn(
                'text-2xl font-bold',
                stat.highlight ? 'text-warning-700' : 'text-neutral-900'
              )}>
                {stat.value}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}