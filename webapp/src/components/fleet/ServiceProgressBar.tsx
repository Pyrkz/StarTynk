'use client'

import { 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  ClockIcon,
  CalendarIcon
} from 'lucide-react'
import type { ServiceProgressPropsEnhanced, ServiceStatusEnhanced } from '@/types/fleet-enhanced'
import { getServiceStatusColorEnhanced, translateServiceStatusEnhanced } from '@/types/fleet-enhanced'
import { Button } from '@/components/ui/Button'

interface ServiceProgressBarProps {
  serviceType: string
  current: number
  target: number
  unit: 'km' | 'days'
  status: ServiceStatusEnhanced
  description?: string
  lastServiceDate?: Date
  nextServiceDate?: Date
  className?: string
}

const ServiceProgressBar: React.FC<ServiceProgressBarProps> = ({
  serviceType,
  current,
  target,
  unit,
  status,
  description,
  lastServiceDate,
  nextServiceDate,
  className = ''
}) => {
  const progress = Math.min((current / target) * 100, 100)
  const remaining = Math.max(target - current, 0)
  const isOverdue = current >= target

  const getStatusIcon = () => {
    switch (status) {
      case 'ok':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />
      case 'upcoming':
        return <ClockIcon className="w-4 h-4 text-blue-600" />
      case 'due_soon':
        return <AlertTriangleIcon className="w-4 h-4 text-yellow-600" />
      case 'overdue':
        return <AlertTriangleIcon className="w-4 h-4 text-red-600" />
      default:
        return <ClockIcon className="w-4 h-4 text-gray-600" />
    }
  }

  const getProgressBarColor = () => {
    if (isOverdue) return 'bg-red-500'
    if (progress >= 80) return 'bg-yellow-500'
    if (progress >= 60) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const formatUnit = (value: number, unit: string) => {
    if (unit === 'km') {
      return `${value.toLocaleString()} km`
    }
    if (unit === 'days') {
      return value === 1 ? '1 dzień' : `${value} dni`
    }
    return `${value} ${unit}`
  }

  const getStatusText = () => {
    if (isOverdue) {
      return `Przeterminowany o ${formatUnit(current - target, unit)}`
    }
    return `Pozostało ${formatUnit(remaining, unit)}`
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <h4 className="font-medium text-gray-900">{serviceType}</h4>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
        <span className={`text-sm font-medium ${
          isOverdue ? 'text-red-600' : 
          status === 'due_soon' ? 'text-yellow-600' :
          status === 'upcoming' ? 'text-blue-600' : 'text-green-600'
        }`}>
          {translateServiceStatusEnhanced(status)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{formatUnit(current, unit)}</span>
          <span>{formatUnit(target, unit)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className={`text-xs mt-1 ${
          isOverdue ? 'text-red-600 font-medium' : 
          status === 'due_soon' ? 'text-yellow-600 font-medium' :
          'text-gray-500'
        }`}>
          {getStatusText()}
        </p>
      </div>

      {/* Service Dates */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        {lastServiceDate && (
          <div>
            <span className="text-gray-500">Ostatni serwis:</span>
            <p className="text-gray-700">
              {lastServiceDate.toLocaleDateString('pl-PL')}
            </p>
          </div>
        )}
        {nextServiceDate && (
          <div>
            <span className="text-gray-500">Następny serwis:</span>
            <p className={`font-medium ${
              isOverdue ? 'text-red-600' : 
              status === 'due_soon' ? 'text-yellow-600' :
              'text-gray-700'
            }`}>
              {nextServiceDate.toLocaleDateString('pl-PL')}
            </p>
          </div>
        )}
      </div>

      {/* Action Button for urgent cases */}
      {(status === 'overdue' || status === 'due_soon') && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <Button 
            size="sm" 
            variant={status === 'overdue' ? 'primary' : 'outline'}
            className="w-full text-xs"
          >
            <CalendarIcon className="w-3 h-3 mr-2" />
            Zaplanuj serwis
          </Button>
        </div>
      )}
    </div>
  )
}

export default ServiceProgressBar