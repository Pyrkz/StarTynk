import React from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui'
import { 
  TruckIcon, 
  MapPinIcon, 
  UserIcon, 
  MoreVerticalIcon,
  WrenchIcon,
  FileTextIcon,
  CarIcon,
  PackageIcon
} from 'lucide-react'
import { 
  FleetOverviewCard, 
  getServiceAlertIcon,
  ServiceAlertType 
} from '@/types/fleet-enhanced'
import { 
  translateVehicleStatus, 
  getVehicleStatusColor,
  translateVehicleType 
} from '@/types/fleet'
import { ServiceCountdownBar } from './ServiceCountdownBar'
import { ServiceAlertBadge } from './ServiceAlertBadge'

interface VehicleCardProps {
  vehicle: FleetOverviewCard
  onScheduleService?: (vehicleId: string) => void
  onViewDetails?: (vehicleId: string) => void
  onEdit?: (vehicleId: string) => void
  onReassign?: (vehicleId: string) => void
  onViewHistory?: (vehicleId: string) => void
}

export function VehicleCard({
  vehicle,
  onScheduleService,
  onViewDetails,
  onEdit,
  onReassign,
  onViewHistory
}: VehicleCardProps) {
  const getVehicleIcon = () => {
    switch (vehicle.type) {
      case 'CAR':
        return <CarIcon className="w-6 h-6 text-gray-600" />
      case 'VAN':
        return <TruckIcon className="w-6 h-6 text-gray-600" />
      case 'TRUCK':
        return <TruckIcon className="w-6 h-6 text-gray-600" />
      case 'EQUIPMENT':
        return <PackageIcon className="w-6 h-6 text-gray-600" />
      default:
        return <TruckIcon className="w-6 h-6 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = () => {
    const color = getVehicleStatusColor(vehicle.status)
    switch (color) {
      case 'success':
        return 'success'
      case 'warning':
        return 'warning'
      case 'error':
        return 'error'
      default:
        return 'neutral'
    }
  }

  const criticalAlerts = vehicle.serviceAlerts.filter(a => a.urgency === 'critical')
  const urgentAlerts = vehicle.serviceAlerts.filter(a => a.urgency === 'urgent')
  const warningAlerts = vehicle.serviceAlerts.filter(a => a.urgency === 'warning')

  // Priority services to show
  const priorityServices: ServiceAlertType[] = ['ENGINE_OIL', 'TRANSMISSION_OIL']
  const servicesToShow = priorityServices
    .map(type => {
      if (type === 'ENGINE_OIL') return vehicle.upcomingServices.engineOil
      if (type === 'TRANSMISSION_OIL') return vehicle.upcomingServices.transmissionOil
      return null
    })
    .filter(Boolean)

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {vehicle.photoUrl ? (
              <img 
                src={vehicle.photoUrl} 
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                {getVehicleIcon()}
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-gray-900">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-sm text-gray-600">{vehicle.licensePlate}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusBadgeVariant()} size="xs">
                  {translateVehicleStatus(vehicle.status)}
                </Badge>
                <span className="text-xs text-gray-500">
                  {translateVehicleType(vehicle.type)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => {/* Show dropdown menu */}}
            >
              <MoreVerticalIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Service Alerts */}
      {vehicle.serviceAlerts.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-b">
          <div className="space-y-2">
            {criticalAlerts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-red-600">Krytyczne:</span>
                <div className="flex flex-wrap gap-1">
                  {criticalAlerts.slice(0, 2).map(alert => (
                    <ServiceAlertBadge
                      key={alert.id}
                      urgency={alert.urgency}
                      status={alert.status}
                      remainingValue={alert.remainingValue}
                      isDistanceBased={alert.isDistanceBased}
                      size="xs"
                    />
                  ))}
                  {criticalAlerts.length > 2 && (
                    <span className="text-xs text-red-600">+{criticalAlerts.length - 2}</span>
                  )}
                </div>
              </div>
            )}
            
            {urgentAlerts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-orange-600">Pilne:</span>
                <div className="flex flex-wrap gap-1">
                  {urgentAlerts.slice(0, 2).map(alert => (
                    <ServiceAlertBadge
                      key={alert.id}
                      urgency={alert.urgency}
                      status={alert.status}
                      remainingValue={alert.remainingValue}
                      isDistanceBased={alert.isDistanceBased}
                      size="xs"
                    />
                  ))}
                  {urgentAlerts.length > 2 && (
                    <span className="text-xs text-orange-600">+{urgentAlerts.length - 2}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Service Countdown Bars */}
      <div className="p-4 space-y-3">
        {servicesToShow.map((service, index) => (
          <ServiceCountdownBar 
            key={service!.type} 
            service={service!} 
            showIcon={true}
            showLabels={true}
          />
        ))}

        {/* Date-based services */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {vehicle.upcomingServices.inspection && (
            <div className="flex items-center gap-1 text-xs">
              <span>{getServiceAlertIcon('INSPECTION')}</span>
              <span className="text-gray-600">Przegląd:</span>
              <span className={`font-medium ${
                vehicle.upcomingServices.inspection.status === 'overdue' 
                  ? 'text-red-600' 
                  : vehicle.upcomingServices.inspection.status === 'due_soon'
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}>
                {new Date(vehicle.upcomingServices.inspection.dueDate).toLocaleDateString('pl-PL')}
              </span>
            </div>
          )}
          
          {vehicle.upcomingServices.insurance && (
            <div className="flex items-center gap-1 text-xs">
              <span>{getServiceAlertIcon('INSURANCE')}</span>
              <span className="text-gray-600">Ubezp.:</span>
              <span className={`font-medium ${
                vehicle.upcomingServices.insurance.status === 'overdue' 
                  ? 'text-red-600' 
                  : vehicle.upcomingServices.insurance.status === 'due_soon'
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}>
                {new Date(vehicle.upcomingServices.insurance.dueDate).toLocaleDateString('pl-PL')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Info */}
      {vehicle.currentAssignment && (
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm">
            {vehicle.currentAssignment.type === 'employee' ? (
              <>
                <UserIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Przypisany do:</span>
                <span className="font-medium text-gray-900">
                  {vehicle.currentAssignment.assignedTo}
                </span>
              </>
            ) : (
              <>
                <MapPinIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Projekt:</span>
                <span className="font-medium text-gray-900">
                  {vehicle.currentAssignment.assignedTo}
                </span>
              </>
            )}
          </div>
          {vehicle.currentAssignment.location && (
            <p className="text-xs text-gray-500 mt-1 ml-6">
              📍 {vehicle.currentAssignment.location}
            </p>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 border-t flex gap-2">
        {vehicle.serviceAlerts.length > 0 && (
          <Button
            size="sm"
            variant="primary"
            className="flex-1 flex items-center gap-1"
            onClick={() => onScheduleService?.(vehicle.id)}
          >
            <WrenchIcon className="w-4 h-4" />
            Zaplanuj serwis
          </Button>
        )}
        
        <Button
          size="sm"
          variant="outline"
          className="flex-1 flex items-center gap-1"
          onClick={() => onViewDetails?.(vehicle.id)}
        >
          <FileTextIcon className="w-4 h-4" />
          Szczegóły
        </Button>
      </div>
    </div>
  )
}