import React from 'react'
import { ServiceInterval, getServiceAlertIcon } from '@/types/fleet-enhanced'

interface ServiceCountdownBarProps {
  service: ServiceInterval
  showIcon?: boolean
  showLabels?: boolean
  className?: string
}

export function ServiceCountdownBar({ 
  service, 
  showIcon = true,
  showLabels = true,
  className = '' 
}: ServiceCountdownBarProps) {
  const getProgressColor = () => {
    if (service.percentageUsed >= 100) return 'bg-red-500'
    if (service.percentageUsed >= 90) return 'bg-orange-500'
    if (service.percentageUsed >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getBackgroundColor = () => {
    if (service.percentageUsed >= 100) return 'bg-red-100'
    if (service.percentageUsed >= 90) return 'bg-orange-100'
    if (service.percentageUsed >= 80) return 'bg-yellow-100'
    return 'bg-gray-200'
  }

  const getServiceLabel = () => {
    const labels = {
      ENGINE_OIL: 'Olej silnikowy',
      TRANSMISSION_OIL: 'Olej przekładniowy',
      TIRE_ROTATION: 'Rotacja opon',
      GENERAL_SERVICE: 'Serwis generalny',
      INSPECTION: 'Przegląd techniczny',
      INSURANCE: 'Ubezpieczenie'
    }
    return labels[service.type] || service.type
  }

  const formatDistance = (km: number) => {
    if (km >= 1000) {
      return `${(km / 1000).toFixed(1)}k`
    }
    return km.toString()
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            {showIcon && <span>{getServiceAlertIcon(service.type)}</span>}
            <span className="font-medium text-gray-700">{getServiceLabel()}</span>
          </div>
          <span className={`font-medium ${service.status === 'overdue' ? 'text-red-600' : 'text-gray-600'}`}>
            {service.status === 'overdue' 
              ? `Zaległe ${formatDistance(Math.abs(service.remainingMileage))} km`
              : `${formatDistance(service.remainingMileage)} km`
            }
          </span>
        </div>
      )}
      
      <div className="relative">
        <div className={`h-2 rounded-full overflow-hidden ${getBackgroundColor()}`}>
          <div 
            className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(100, service.percentageUsed)}%` }}
          />
        </div>
        
        {showLabels && (
          <div className="flex justify-between text-xs text-gray-500 mt-0.5">
            <span>{formatDistance(service.currentMileage - (service.lastServiceMileage || 0))}</span>
            <span>{formatDistance(service.intervalMileage)}</span>
          </div>
        )}
      </div>
    </div>
  )
}