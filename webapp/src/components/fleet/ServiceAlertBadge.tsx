import React from 'react'
import { Badge } from '@/components/ui'
import { 
  AlertTriangleIcon, 
  AlertCircleIcon, 
  InfoIcon,
  ClockIcon 
} from 'lucide-react'
import { 
  ServiceAlertUrgency, 
  ServiceAlertStatus,
  getStatusBadgeVariant 
} from '@/types/fleet-enhanced'

interface ServiceAlertBadgeProps {
  urgency: ServiceAlertUrgency
  status: ServiceAlertStatus
  remainingValue: number
  isDistanceBased: boolean
  className?: string
  size?: 'xs' | 'sm' | 'md'
}

export function ServiceAlertBadge({ 
  urgency, 
  status, 
  remainingValue, 
  isDistanceBased,
  className = '',
  size = 'sm' 
}: ServiceAlertBadgeProps) {
  const getIcon = () => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangleIcon className="w-3 h-3" />
      case 'urgent':
        return <AlertCircleIcon className="w-3 h-3" />
      case 'warning':
        return <InfoIcon className="w-3 h-3" />
      default:
        return <ClockIcon className="w-3 h-3" />
    }
  }

  const getLabel = () => {
    const unit = isDistanceBased ? 'km' : (Math.abs(remainingValue) === 1 ? 'dzień' : 'dni')
    
    if (status === 'overdue') {
      return `Zaległe ${Math.abs(remainingValue)} ${unit}`
    }
    
    if (remainingValue === 0) {
      return 'Dziś'
    }
    
    return `${remainingValue} ${unit}`
  }

  return (
    <Badge 
      variant={getStatusBadgeVariant(status)} 
      size={size}
      className={`inline-flex items-center gap-1 ${className}`}
    >
      {getIcon()}
      {getLabel()}
    </Badge>
  )
}