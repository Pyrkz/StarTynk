import React, { useState } from 'react'
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
  PackageIcon,
  ChevronRightIcon,
  XIcon
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

interface VehicleCardMobileProps {
  vehicle: FleetOverviewCard
  onScheduleService?: (vehicleId: string) => void
  onViewDetails?: (vehicleId: string) => void
  onEdit?: (vehicleId: string) => void
  onReassign?: (vehicleId: string) => void
  onViewHistory?: (vehicleId: string) => void
}

export function VehicleCardMobile({
  vehicle,
  onScheduleService,
  onViewDetails,
  onEdit,
  onReassign,
  onViewHistory
}: VehicleCardMobileProps) {
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const getVehicleIcon = () => {
    switch (vehicle.type) {
      case 'CAR':
        return <CarIcon className="w-5 h-5 text-gray-600" />
      case 'VAN':
        return <TruckIcon className="w-5 h-5 text-gray-600" />
      case 'TRUCK':
        return <TruckIcon className="w-5 h-5 text-gray-600" />
      case 'EQUIPMENT':
        return <PackageIcon className="w-5 h-5 text-gray-600" />
      default:
        return <TruckIcon className="w-5 h-5 text-gray-600" />
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
  const hasAlerts = vehicle.serviceAlerts.length > 0

  // Priority service to show
  const priorityService = vehicle.upcomingServices.engineOil

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Compact Header */}
        <div 
          className="p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              {vehicle.photoUrl ? (
                <img 
                  src={vehicle.photoUrl} 
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  {getVehicleIcon()}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <ChevronRightIcon 
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                  />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-600">{vehicle.licensePlate}</span>
                  <Badge variant={getStatusBadgeVariant()} size="xs">
                    {translateVehicleStatus(vehicle.status)}
                  </Badge>
                </div>
                
                {/* Alert summary */}
                {hasAlerts && (
                  <div className="flex items-center gap-2 mt-1">
                    {criticalAlerts.length > 0 && (
                      <span className="text-xs text-red-600 font-medium">
                        {criticalAlerts.length} krytyczne
                      </span>
                    )}
                    {urgentAlerts.length > 0 && (
                      <span className="text-xs text-orange-600 font-medium">
                        {urgentAlerts.length} pilne
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assignment info - always visible */}
          {vehicle.currentAssignment && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
              {vehicle.currentAssignment.type === 'employee' ? (
                <>
                  <UserIcon className="w-3 h-3" />
                  <span>{vehicle.currentAssignment.assignedTo}</span>
                </>
              ) : (
                <>
                  <MapPinIcon className="w-3 h-3" />
                  <span>{vehicle.currentAssignment.assignedTo}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <>
            {/* Priority Service Bar */}
            {priorityService && (
              <div className="px-3 pb-3">
                <ServiceCountdownBar 
                  service={priorityService} 
                  showIcon={true}
                  showLabels={true}
                  className="text-xs"
                />
              </div>
            )}

            {/* Service Alerts */}
            {hasAlerts && (
              <div className="px-3 pb-3 border-t pt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Alerty serwisowe:</p>
                <div className="space-y-1">
                  {vehicle.serviceAlerts.slice(0, 3).map(alert => (
                    <div key={alert.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span>{getServiceAlertIcon(alert.type)}</span>
                        <span className="text-gray-600 truncate">
                          {alert.message.split(':')[0]}
                        </span>
                      </div>
                      <ServiceAlertBadge
                        urgency={alert.urgency}
                        status={alert.status}
                        remainingValue={alert.remainingValue}
                        isDistanceBased={alert.isDistanceBased}
                        size="xs"
                      />
                    </div>
                  ))}
                  {vehicle.serviceAlerts.length > 3 && (
                    <p className="text-xs text-gray-500 mt-1">
                      +{vehicle.serviceAlerts.length - 3} więcej
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-3 border-t flex gap-2">
              {hasAlerts && (
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 text-xs touch-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onScheduleService?.(vehicle.id)
                  }}
                >
                  <WrenchIcon className="w-4 h-4 mr-1" />
                  Serwis
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs touch-button"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails?.(vehicle.id)
                }}
              >
                <FileTextIcon className="w-4 h-4 mr-1" />
                Szczegóły
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="p-2 touch-button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowActionSheet(true)
                }}
              >
                <MoreVerticalIcon className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Action Sheet */}
      {showActionSheet && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowActionSheet(false)}
          />
          <div className="action-sheet open">
            <div className="action-sheet-handle" />
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 mb-3">
                {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
              </h3>
              
              <button
                className="w-full text-left py-3 px-4 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                onClick={() => {
                  setShowActionSheet(false)
                  onViewDetails?.(vehicle.id)
                }}
              >
                <FileTextIcon className="w-5 h-5 text-gray-600" />
                <span>Zobacz szczegóły</span>
              </button>

              {hasAlerts && (
                <button
                  className="w-full text-left py-3 px-4 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                  onClick={() => {
                    setShowActionSheet(false)
                    onScheduleService?.(vehicle.id)
                  }}
                >
                  <WrenchIcon className="w-5 h-5 text-gray-600" />
                  <span>Zaplanuj serwis</span>
                </button>
              )}

              <button
                className="w-full text-left py-3 px-4 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                onClick={() => {
                  setShowActionSheet(false)
                  onEdit?.(vehicle.id)
                }}
              >
                <FileTextIcon className="w-5 h-5 text-gray-600" />
                <span>Edytuj dane</span>
              </button>

              <button
                className="w-full text-left py-3 px-4 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                onClick={() => {
                  setShowActionSheet(false)
                  onReassign?.(vehicle.id)
                }}
              >
                <UserIcon className="w-5 h-5 text-gray-600" />
                <span>Zmień przypisanie</span>
              </button>

              <button
                className="w-full text-left py-3 px-4 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                onClick={() => {
                  setShowActionSheet(false)
                  onViewHistory?.(vehicle.id)
                }}
              >
                <FileTextIcon className="w-5 h-5 text-gray-600" />
                <span>Historia serwisowa</span>
              </button>

              <button
                className="w-full text-left py-3 px-4 hover:bg-gray-50 rounded-lg flex items-center gap-3 text-gray-500"
                onClick={() => setShowActionSheet(false)}
              >
                <XIcon className="w-5 h-5" />
                <span>Anuluj</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}