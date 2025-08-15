'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  TruckIcon,
  WrenchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  MoreVerticalIcon
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import ServiceCompletionModal from './ServiceCompletionModal'
import type {
  VehicleWithServicesEnhanced,
  EnhancedServiceType,
  ScheduleServiceDataEnhanced
} from '@/types/fleet-enhanced'
import { translateServiceTypeEnhanced } from '@/types/fleet-enhanced'

type TabType = 'vehicles' | 'engine_oil' | 'transmission_oil' | 'technical_inspection' | 'repairs'

interface ServiceTabsManagerProps {
  vehicles: VehicleWithServicesEnhanced[]
  onScheduleService: (data: ScheduleServiceDataEnhanced) => Promise<boolean>
  onMarkServiceComplete: (serviceId: string) => Promise<boolean>
  loading?: boolean
  className?: string
}

const ServiceTabsManager: React.FC<ServiceTabsManagerProps> = ({
  vehicles,
  onScheduleService,
  onMarkServiceComplete,
  loading = false,
  className = ''
}) => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('vehicles')
  const [serviceModal, setServiceModal] = useState<{
    isOpen: boolean
    vehicle?: VehicleWithServicesEnhanced
    serviceType?: EnhancedServiceType
  }>({ isOpen: false })

  // Calculate service thresholds and counts
  const serviceCounts = useMemo(() => {
    const counts = {
      engine_oil: 0,
      transmission_oil: 0,
      technical_inspection: 0,
      repairs: 0
    }

    vehicles.forEach(vehicle => {
      const isDeliveryVehicle = vehicle.type === 'VAN' || vehicle.type === 'TRUCK'
      const mileageThreshold = isDeliveryVehicle ? 30000 : 10000

      vehicle.upcomingServices.forEach(service => {
        const daysDue = Math.ceil((service.nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        const mileageDue = service.nextDueMileage ? (service.nextDueMileage - vehicle.currentMileage) : null
        
        const isApproaching = daysDue <= 30 || (mileageDue !== null && mileageDue <= mileageThreshold)
        
        if (isApproaching) {
          switch (service.type) {
            case 'ENGINE_OIL':
              counts.engine_oil++
              break
            case 'TRANSMISSION_OIL':
              counts.transmission_oil++
              break
            case 'TECHNICAL_INSPECTION':
              counts.technical_inspection++
              break
            case 'REPAIR':
              counts.repairs++
              break
          }
        }
      })
    })

    return counts
  }, [vehicles])

  const getServiceStatusForVehicle = (vehicle: VehicleWithServicesEnhanced, serviceType: EnhancedServiceType) => {
    const service = vehicle.upcomingServices.find(s => s.type === serviceType)
    if (!service) return null

    const daysDue = Math.ceil((service.nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    const mileageDue = service.nextDueMileage ? (service.nextDueMileage - vehicle.currentMileage) : null
    
    // Determine status based on days and mileage
    let status: 'ok' | 'warning' | 'critical' = 'ok'
    
    if (daysDue < 0 || (mileageDue !== null && mileageDue < 0)) {
      status = 'critical' // Overdue
    } else if (daysDue <= 30 || (mileageDue !== null && mileageDue <= 5000)) {
      status = 'warning' // Approaching
    }

    return { service, daysDue, mileageDue, status }
  }

  const handleServiceClick = (vehicle: VehicleWithServicesEnhanced, serviceType: EnhancedServiceType) => {
    setServiceModal({
      isOpen: true,
      vehicle,
      serviceType
    })
  }

  const handleModalClose = () => {
    setServiceModal({ isOpen: false })
  }

  const handleServiceScheduled = async (serviceData: ScheduleServiceDataEnhanced) => {
    const success = await onScheduleService(serviceData)
    if (success) {
      setServiceModal({ isOpen: false })
    }
    return success
  }

  const handleVehicleClick = (licensePlate: string) => {
    router.push(`/dashboard/flota/${licensePlate}`)
  }

  const tabs = [
    {
      id: 'vehicles' as TabType,
      label: 'Lista pojazdów',
      icon: TruckIcon,
      count: vehicles.length
    },
    {
      id: 'engine_oil' as TabType,
      label: 'Oleje silnikowe',
      icon: WrenchIcon,
      count: serviceCounts.engine_oil
    },
    {
      id: 'transmission_oil' as TabType,
      label: 'Oleje skrzyni biegów',
      icon: SettingsIcon,
      count: serviceCounts.transmission_oil
    },
    {
      id: 'technical_inspection' as TabType,
      label: 'Przeglądy techniczne',
      icon: ShieldCheckIcon,
      count: serviceCounts.technical_inspection
    },
    {
      id: 'repairs' as TabType,
      label: 'Naprawy',
      icon: AlertTriangleIcon,
      count: serviceCounts.repairs
    }
  ]

  const renderVehicleList = (vehicleList: VehicleWithServicesEnhanced[], serviceType?: EnhancedServiceType) => {
    if (vehicleList.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">
            {serviceType 
              ? `Brak pojazdów wymagających serwisu typu "${translateServiceTypeEnhanced(serviceType)}"`
              : 'Nie dodano jeszcze żadnych pojazdów do floty'
            }
          </p>
        </div>
      )
    }

    // Mock construction site data
    const mockConstructionSites: Record<string, string> = {
      'DL-TEST1': 'Budowa Centrum Handlowego Arkadia',
      'DL-TEST2': 'Rozbudowa Autostrady A4 - odcinek Wrocław',
      'DL-TEST3': 'Modernizacja Dworca PKP Warszawa',
    }

    // For the main vehicles tab, show a simpler list
    if (!serviceType) {
      return (
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pojazd
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Przebieg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budowa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Przypisanie
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Akcje</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicleList.map(vehicle => {
                const currentAssignment = vehicle.assignments?.find(a => a.isActive)
                const constructionSite = mockConstructionSites[vehicle.licensePlate] || null
                
                return (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleVehicleClick(vehicle.licensePlate)}
                        className="text-left hover:text-blue-600 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle.licensePlate} • {vehicle.year}
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vehicle.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        vehicle.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {vehicle.status === 'ACTIVE' ? 'Aktywny' :
                         vehicle.status === 'MAINTENANCE' ? 'W serwisie' :
                         'Nieaktywny'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.currentMileage.toLocaleString()} km
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {constructionSite ? (
                        <div className="text-sm text-gray-900">
                          {constructionSite}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Brak przypisania</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {currentAssignment ? (
                        <div className="text-sm text-gray-900">
                          {currentAssignment.user.name || currentAssignment.user.email}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Nieprzypisany</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-500">
                        <MoreVerticalIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }

    // For service-specific tabs, show all vehicles with service status
    return (
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pojazd
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Przebieg
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ostatni serwis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Następny termin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pozostało
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Koszt
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Akcje</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicleList.map(vehicle => {
              const serviceInfo = getServiceStatusForVehicle(vehicle, serviceType)
              
              if (!serviceInfo) {
                // Vehicle doesn't have this service type
                return (
                  <tr key={vehicle.id} className="hover:bg-gray-50 opacity-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleVehicleClick(vehicle.licensePlate)}
                        className="text-left hover:text-blue-600 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle.licensePlate} • {vehicle.year}
                        </div>
                      </button>
                    </td>
                    <td colSpan={6} className="px-6 py-4 text-sm text-gray-500 text-center">
                      Brak danych o tym serwisie
                    </td>
                  </tr>
                )
              }

              const { service, daysDue, mileageDue, status } = serviceInfo
              const rowBgClass = status === 'critical' ? 'bg-red-50' : status === 'warning' ? 'bg-orange-50' : ''
              
              return (
                <tr key={vehicle.id} className={`hover:bg-gray-50 ${rowBgClass}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleVehicleClick(vehicle.licensePlate)}
                      className="text-left hover:text-blue-600 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-sm text-gray-500">
                        {vehicle.licensePlate} • {vehicle.type === 'VAN' || vehicle.type === 'TRUCK' ? 'Dostawczy' : 'Osobowy'}
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vehicle.currentMileage.toLocaleString()} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {service.lastServiceDate ? (
                      <div>
                        <div>{service.lastServiceDate.toLocaleDateString('pl-PL')}</div>
                        {service.lastServiceMileage && (
                          <div className="text-xs text-gray-500">
                            przy {service.lastServiceMileage.toLocaleString()} km
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      status === 'critical' ? 'text-red-600' :
                      status === 'warning' ? 'text-orange-600' :
                      'text-gray-900'
                    }`}>
                      {service.nextDueDate.toLocaleDateString('pl-PL')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {daysDue === 0 ? 'Dziś' :
                       daysDue === 1 ? 'Jutro' :
                       daysDue > 0 ? `Za ${daysDue} dni` :
                       `${Math.abs(daysDue)} dni temu`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {mileageDue !== null && (
                        <div className={`font-medium ${
                          status === 'critical' ? 'text-red-600' :
                          status === 'warning' ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {mileageDue > 0 
                            ? `${mileageDue.toLocaleString()} km`
                            : `Przekroczono o ${Math.abs(mileageDue).toLocaleString()} km`
                          }
                        </div>
                      )}
                      <div className="flex items-center mt-1">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          status === 'critical' ? 'bg-red-500' :
                          status === 'warning' ? 'bg-orange-500' : 
                          'bg-green-500'
                        }`} />
                        <span className="text-xs text-gray-600">
                          {status === 'critical' ? 'Przekroczony' :
                           status === 'warning' ? 'Zbliża się' :
                           'W terminie'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {service.estimatedCost.toLocaleString('pl-PL', {
                      style: 'currency',
                      currency: 'PLN',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      onClick={() => handleServiceClick(vehicle, service.type)}
                      size="sm"
                      variant={status === 'critical' ? 'primary' : 'outline'}
                      className="text-xs"
                    >
                      Zaplanuj
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'vehicles':
        return renderVehicleList(vehicles)
      case 'engine_oil':
        return renderVehicleList(vehicles, 'ENGINE_OIL')
      case 'transmission_oil':
        return renderVehicleList(vehicles, 'TRANSMISSION_OIL')
      case 'technical_inspection':
        return renderVehicleList(vehicles, 'TECHNICAL_INSPECTION')
      case 'repairs':
        return renderVehicleList(vehicles, 'REPAIR')
      default:
        return null
    }
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                      isActive 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600 mt-2">Ładowanie danych...</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Service Completion Modal */}
      {serviceModal.isOpen && serviceModal.vehicle && serviceModal.serviceType && (
        <ServiceCompletionModal
          isOpen={serviceModal.isOpen}
          onClose={handleModalClose}
          onSchedule={handleServiceScheduled}
          vehicle={serviceModal.vehicle}
          serviceType={serviceModal.serviceType}
        />
      )}
    </div>
  )
}

export default ServiceTabsManager