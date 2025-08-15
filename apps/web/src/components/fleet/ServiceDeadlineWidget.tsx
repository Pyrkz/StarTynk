'use client'

import { useState } from 'react'
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  TruckIcon,
  WrenchIcon,
  FilterIcon,
  MoreHorizontalIcon
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type {
  UpcomingServiceEnhanced,
  ServiceDeadlineDataEnhanced,
  EnhancedServiceType,
  ServiceUrgency
} from '@/types/fleet-enhanced'
import {
  translateServiceTypeEnhanced,
  getServiceUrgencyColorEnhanced
} from '@/types/fleet-enhanced'

interface ServiceDeadlineWidgetProps {
  data: ServiceDeadlineDataEnhanced
  onScheduleService: (vehicleId: string, serviceType: EnhancedServiceType) => void
  onMarkComplete: (serviceId: string) => void
  onViewDetails: (vehicleId: string) => void
  className?: string
}

interface ServiceFilterState {
  serviceType: EnhancedServiceType | 'ALL'
  urgency: ServiceUrgency | 'ALL'
  sortBy: 'dueDate' | 'urgency' | 'cost' | 'vehicle'
}

const ServiceDeadlineWidget: React.FC<ServiceDeadlineWidgetProps> = ({
  data,
  onScheduleService,
  onMarkComplete,
  onViewDetails,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'overdue' | 'due_soon' | 'upcoming'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ServiceFilterState>({
    serviceType: 'ALL',
    urgency: 'ALL',
    sortBy: 'dueDate'
  })

  const getServiceIcon = (type: EnhancedServiceType) => {
    switch (type) {
      case 'ENGINE_OIL':
      case 'TRANSMISSION_OIL':
        return <WrenchIcon className="w-4 h-4" />
      case 'TECHNICAL_INSPECTION':
        return <ClockIcon className="w-4 h-4" />
      case 'REPAIR':
        return <AlertTriangleIcon className="w-4 h-4" />
      default:
        return <WrenchIcon className="w-4 h-4" />
    }
  }

  const getUrgencyBadgeVariant = (urgency: ServiceUrgency) => {
    switch (urgency) {
      case 'critical':
        return 'error'
      case 'warning':
        return 'warning'
      case 'upcoming':
        return 'primary'
      default:
        return 'neutral'
    }
  }

  const getUrgencyIcon = (urgency: ServiceUrgency) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangleIcon className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertTriangleIcon className="w-4 h-4 text-yellow-600" />
      case 'upcoming':
        return <CalendarDaysIcon className="w-4 h-4 text-blue-600" />
      default:
        return <CalendarDaysIcon className="w-4 h-4 text-gray-600" />
    }
  }

  const getAllServices = (): UpcomingServiceEnhanced[] => {
    return [...data.overdue, ...data.dueSoon, ...data.upcoming]
  }

  const getFilteredServices = (): UpcomingServiceEnhanced[] => {
    let services = getAllServices()

    // Apply urgency filter
    if (activeFilter === 'overdue') {
      services = data.overdue
    } else if (activeFilter === 'due_soon') {
      services = data.dueSoon
    } else if (activeFilter === 'upcoming') {
      services = data.upcoming
    }

    // Apply additional filters
    if (filters.serviceType !== 'ALL') {
      services = services.filter(service => service.type === filters.serviceType)
    }

    if (filters.urgency !== 'ALL') {
      services = services.filter(service => service.urgency === filters.urgency)
    }

    // Apply sorting
    services.sort((a, b) => {
      switch (filters.sortBy) {
        case 'dueDate':
          return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
        case 'urgency':
          const urgencyOrder = { critical: 0, warning: 1, upcoming: 2, normal: 3 }
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
        case 'cost':
          return b.estimatedCost - a.estimatedCost
        case 'vehicle':
          return `${a.vehicleInfo.make} ${a.vehicleInfo.model}`.localeCompare(
            `${b.vehicleInfo.make} ${b.vehicleInfo.model}`
          )
        default:
          return 0
      }
    })

    return services
  }

  const filteredServices = getFilteredServices()

  if (data.totalCount === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WrenchIcon className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Wszystkie pojazdy aktualne
            </h3>
            <p className="text-gray-600">
              Brak nadchodzących terminów serwisowych
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangleIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Nadchodzące terminy serwisów
              </h2>
              <p className="text-sm text-gray-600">
                {data.totalCount} {data.totalCount === 1 ? 'pojazd wymaga' : 'pojazdów wymaga'} uwagi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <FilterIcon className="w-4 h-4" />
              Filtry
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{data.criticalCount}</p>
            <p className="text-xs text-gray-600">Przeterminowane</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{data.warningCount}</p>
            <p className="text-xs text-gray-600">Wymagają uwagi</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{data.upcomingCount}</p>
            <p className="text-xs text-gray-600">Nadchodzące</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ serwisu
              </label>
              <select
                value={filters.serviceType}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  serviceType: e.target.value as EnhancedServiceType | 'ALL' 
                }))}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Wszystkie</option>
                <option value="ENGINE_OIL">Olej silnikowy</option>
                <option value="TRANSMISSION_OIL">Olej przekładniowy</option>
                <option value="TECHNICAL_INSPECTION">Przegląd techniczny</option>
                <option value="REPAIR">Naprawa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorytet
              </label>
              <select
                value={filters.urgency}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  urgency: e.target.value as ServiceUrgency | 'ALL' 
                }))}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Wszystkie</option>
                <option value="critical">Krytyczny</option>
                <option value="warning">Ostrzeżenie</option>
                <option value="upcoming">Nadchodzący</option>
                <option value="normal">Normalny</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sortuj według
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  sortBy: e.target.value as 'dueDate' | 'urgency' | 'cost' | 'vehicle' 
                }))}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dueDate">Termin</option>
                <option value="urgency">Priorytet</option>
                <option value="cost">Koszt</option>
                <option value="vehicle">Pojazd</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {isExpanded && (
        <div className="px-6 py-3 border-b">
          <div className="flex gap-1">
            {[
              { key: 'all', label: 'Wszystkie', count: data.totalCount },
              { key: 'overdue', label: 'Przeterminowane', count: data.criticalCount },
              { key: 'due_soon', label: 'Wymagają uwagi', count: data.warningCount },
              { key: 'upcoming', label: 'Nadchodzące', count: data.upcomingCount }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Brak serwisów spełniających kryteria filtrowania</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    service.urgency === 'critical'
                      ? 'border-l-red-500 bg-red-50'
                      : service.urgency === 'warning'
                      ? 'border-l-yellow-500 bg-yellow-50'
                      : service.urgency === 'upcoming'
                      ? 'border-l-blue-500 bg-blue-50'
                      : 'border-l-gray-500 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Vehicle Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <TruckIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {service.vehicleInfo.make} {service.vehicleInfo.model} ({service.vehicleInfo.year})
                          </p>
                          <p className="text-sm text-gray-600">
                            {service.vehicleInfo.licensePlate}
                          </p>
                        </div>
                      </div>

                      {/* Service Info */}
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          service.urgency === 'critical'
                            ? 'bg-red-100'
                            : service.urgency === 'warning'
                            ? 'bg-yellow-100'
                            : service.urgency === 'upcoming'
                            ? 'bg-blue-100'
                            : 'bg-gray-100'
                        }`}>
                          {getServiceIcon(service.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {translateServiceTypeEnhanced(service.type)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {service.description || 'Rutynowy serwis'}
                          </p>
                        </div>
                      </div>

                      {/* Due Info */}
                      <div className="flex items-center gap-2">
                        {getUrgencyIcon(service.urgency)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {service.dueIn}
                          </p>
                          <p className="text-sm text-gray-600">
                            {service.nextDueDate.toLocaleDateString('pl-PL')}
                          </p>
                        </div>
                      </div>

                      {/* Cost */}
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {service.estimatedCost.toLocaleString('pl-PL', {
                            style: 'currency',
                            currency: 'PLN',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })}
                        </p>
                        <Badge variant={getUrgencyBadgeVariant(service.urgency)} size="sm">
                          {service.urgency === 'critical' ? 'Krytyczny' :
                           service.urgency === 'warning' ? 'Ostrzeżenie' :
                           service.urgency === 'upcoming' ? 'Nadchodzący' : 'Normalny'}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => onScheduleService(service.vehicleId, service.type)}
                        className="flex items-center gap-2"
                      >
                        <CalendarDaysIcon className="w-4 h-4" />
                        Zaplanuj
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMarkComplete(service.id)}
                      >
                        Wykonano
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewDetails(service.vehicleId)}
                      >
                        Szczegóły
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                      >
                        <MoreHorizontalIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All Button */}
          {data.totalCount > filteredServices.length && (
            <div className="text-center mt-6 pt-4 border-t">
              <Button variant="outline" size="sm">
                Zobacz wszystkie terminy serwisów ({data.totalCount})
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ServiceDeadlineWidget