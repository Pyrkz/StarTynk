'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  EditIcon,
  WrenchIcon,
  FileTextIcon,
  TruckIcon,
  UserIcon,
  DollarSignIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MoreVerticalIcon,
  DownloadIcon,
  ShareIcon,
  PlusIcon,
  PhoneIcon,
  MailIcon,
  Settings2Icon,
  BarChart3Icon,
  FuelIcon,
  CameraIcon,
  FileIcon,
  CalendarDaysIcon,
  SparklesIcon,
  TrendingUpIcon,
  GaugeIcon,
  MapPinIcon,
  ActivityIcon,
  ShieldIcon
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { 
  ExtendedVehicleData,
  VehicleStatus 
} from '@/types/fleet'
import type {
  EnhancedServiceType,
  VehicleWithServicesEnhanced,
  ServiceHistoryFiltersEnhanced
} from '@/types/fleet-enhanced'
import { 
  getVehicleStatusColor, 
  translateVehicleStatus, 
  translateMaintenanceType,
  getVehicleDisplayName 
} from '@/types/fleet'
import ServiceProgressBar from '@/components/fleet/ServiceProgressBar'
import ServiceHistoryTable from '@/components/fleet/ServiceHistoryTable'
import ServiceSchedulingModal from '@/components/fleet/ServiceSchedulingModal'
import { useServiceManagement } from '@/hooks/fleet/useServiceManagement'

// Service schedule item interface
interface ServiceScheduleItem {
  id: string
  type: 'engine_oil' | 'transmission_oil' | 'inspection' | 'insurance'
  name: string
  current: number
  target: number
  unit: 'km' | 'months'
  status: 'good' | 'warning' | 'critical'
  nextDue: string
  lastService: string
  provider?: string
}

export default function VehicleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<ExtendedVehicleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('service')
  const [error, setError] = useState<string | null>(null)

  const vehicleSlug = params.slug as string

  // Service management integration
  const {
    scheduleService,
    markServiceComplete,
    filterServiceHistory,
    getVehicleByLicensePlate,
    loading: serviceLoading
  } = useServiceManagement()

  // Service-related state
  const [serviceHistoryFilters, setServiceHistoryFilters] = useState<ServiceHistoryFiltersEnhanced>({})
  const [schedulingModal, setSchedulingModal] = useState<{
    isOpen: boolean
    serviceType?: EnhancedServiceType
  }>({
    isOpen: false
  })

  // Get enhanced vehicle data
  const enhancedVehicle = getVehicleByLicensePlate(vehicleSlug)

  const fetchVehicleDetails = useCallback(async () => {
    if (!vehicleSlug) return
    
    setLoading(true)
    setError(null)
    
    try {
      // vehicleSlug jest już zdekodowany przez Next.js, ale musimy go ponownie zakodować dla URL
      const encodedSlug = encodeURIComponent(vehicleSlug)
      const response = await fetch(`/api/vehicles/${encodedSlug}`)
      if (!response.ok) {
        throw new Error('Nie udało się pobrać danych pojazdu')
      }
      
      const data = await response.json()
      setVehicle(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }, [vehicleSlug])

  useEffect(() => {
    fetchVehicleDetails()
  }, [fetchVehicleDetails])

  const getStatusBadgeVariant = (status: VehicleStatus) => {
    const color = getVehicleStatusColor(status)
    switch (color) {
      case 'success': return 'success'
      case 'warning': return 'warning'
      case 'error': return 'error'
      default: return 'neutral'
    }
  }

  const getCurrentAssignment = () => {
    return vehicle?.assignments?.find(assignment => assignment.isActive)
  }

  // Service management handlers
  const handleScheduleService = useCallback((serviceType: EnhancedServiceType) => {
    if (!enhancedVehicle) return
    
    setSchedulingModal({
      isOpen: true,
      serviceType
    })
  }, [enhancedVehicle])

  const handleSchedulingModalClose = useCallback(() => {
    setSchedulingModal({ isOpen: false })
  }, [])

  const handleServiceScheduled = useCallback(async (serviceData: any) => {
    try {
      const success = await scheduleService(serviceData)
      if (success) {
        setSchedulingModal({ isOpen: false })
        console.log('Service scheduled successfully')
      }
      return success
    } catch (error) {
      console.error('Failed to schedule service:', error)
      return false
    }
  }, [scheduleService])

  const handleServiceHistoryExport = useCallback(() => {
    if (!enhancedVehicle) return
    
    const filteredServices = filterServiceHistory(serviceHistoryFilters, enhancedVehicle.id)
    const csvData = filteredServices.map(service => ({
      Date: service.date.toLocaleDateString('pl-PL'),
      Type: service.type,
      Mileage: service.mileage || '',
      Cost: service.cost,
      Provider: service.provider,
      Notes: service.notes || ''
    }))
    
    console.log('Exporting service history:', csvData)
    // In a real app, this would trigger a CSV download
  }, [enhancedVehicle, filterServiceHistory, serviceHistoryFilters])

  const handleServiceHistoryView = useCallback((serviceId: string) => {
    console.log('Viewing service details:', serviceId)
    // In a real app, this would open a service details modal
  }, [])

  const handleServiceHistoryEdit = useCallback((serviceId: string) => {
    console.log('Editing service:', serviceId)
    // In a real app, this would open a service editing modal
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Błąd ładowania pojazdu
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'Nie znaleziono pojazdu'}
          </p>
          <Button onClick={() => router.push('/dashboard/flota')}>
            Powrót do listy pojazdów
          </Button>
        </div>
      </div>
    )
  }

  const currentAssignment = getCurrentAssignment()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard/flota')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {getVehicleDisplayName(vehicle)}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge
                      variant={getStatusBadgeVariant(vehicle.status)}
                      size="sm"
                    >
                      {translateVehicleStatus(vehicle.status)}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {vehicle.licensePlate} • {vehicle.year}
                    </span>
                  </div>
                </div>
              </div>
          
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleScheduleService('ENGINE_OIL')}
                  className="text-sm"
                >
                  <WrenchIcon className="w-4 h-4 mr-2" />
                  Zaplanuj serwis
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVerticalIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-6 py-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">47,580 km</p>
              <p className="text-sm text-gray-500">Przebieg</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-green-600">Aktualny</p>
              <p className="text-sm text-gray-500">Status serwisu</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {currentAssignment ? currentAssignment.user.name || 'Przypisany' : 'Nieprzypisany'}
              </p>
              <p className="text-sm text-gray-500">Kierowca</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">4,580 zł</p>
              <p className="text-sm text-gray-500">Koszty (rok)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informacje o pojeździe</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Numer rejestracyjny</p>
                    <p className="font-medium text-gray-900">{vehicle.licensePlate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">VIN</p>
                    <p className="font-mono text-sm text-gray-900">{vehicle.vin || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rok produkcji</p>
                    <p className="font-medium text-gray-900">{vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Typ pojazdu</p>
                    <p className="font-medium text-gray-900">
                      {vehicle.type === 'VAN' ? 'Van' : 
                       vehicle.type === 'TRUCK' ? 'Ciężarówka' : 
                       'Osobowy'}
                    </p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500">Aktualny przebieg</p>
                    <p className="text-xl font-semibold text-gray-900">47,580 km</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Harmonogram serwisów</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ServiceProgressBar
                    serviceType="Olej silnikowy"
                    current={2580}
                    target={5000}
                    unit="km"
                    status="ok"
                    description="Wymiana oleju silnikowego i filtra"
                    lastServiceDate={new Date('2024-03-15')}
                    nextServiceDate={new Date('2024-06-15')}
                  />
                  <ServiceProgressBar
                    serviceType="Olej przekładniowy"
                    current={8580}
                    target={25000}
                    unit="km"
                    status="ok"
                    description="Wymiana oleju przekładniowego"
                    lastServiceDate={new Date('2024-01-10')}
                    nextServiceDate={new Date('2024-12-10')}
                  />
                  <ServiceProgressBar
                    serviceType="Przegląd techniczny"
                    current={123}
                    target={365}
                    unit="days"
                    status="ok"
                    description="Obowiązkowy przegląd techniczny"
                    nextServiceDate={new Date('2024-09-15')}
                  />
                  <ServiceProgressBar
                    serviceType="Ubezpieczenie"
                    current={12}
                    target={365}
                    unit="days"
                    status="due_soon"
                    description="Polisa ubezpieczeniowa"
                    nextServiceDate={new Date('2024-08-03')}
                  />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ostatnie zdarzenia</h3>
                <div className="space-y-3">
                  {vehicle.maintenances?.slice(0, 5).map((maintenance) => (
                    <div key={maintenance.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                          maintenance.type === 'REPAIR' ? 'bg-red-500' :
                          maintenance.type === 'SERVICE' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {translateMaintenanceType(maintenance.type)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(maintenance.serviceDate).toLocaleDateString('pl-PL')} • {maintenance.mileage?.toLocaleString()} km
                        </p>
                        {maintenance.serviceProvider && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {maintenance.serviceProvider}
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {maintenance.cost.toLocaleString('pl-PL', { 
                          style: 'currency', 
                          currency: 'PLN',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 mt-4">
                  Zobacz pełną historię →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <nav className="flex space-x-8">
            {[
              { id: 'service', label: 'Serwis i konserwacja' },
              { id: 'assignments', label: 'Historia przypisań' },
              { id: 'costs', label: 'Analiza kosztów' },
              { id: 'documents', label: 'Dokumenty' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'service' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Historia serwisów</h3>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Typ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Przebieg
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serwisant
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
                    {vehicle.maintenances?.map((maintenance) => (
                      <tr key={maintenance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(maintenance.serviceDate).toLocaleDateString('pl-PL')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="neutral" size="sm">
                            {translateMaintenanceType(maintenance.type)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {maintenance.mileage ? `${maintenance.mileage.toLocaleString()} km` : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {maintenance.serviceProvider || 'Serwis wewnętrzny'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {maintenance.cost.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button variant="ghost" size="sm">
                            Szczegóły
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Other tabs content (assignments, costs, documents) would go here */}
        </div>

        {/* Service Scheduling Modal */}
        {schedulingModal.isOpen && schedulingModal.serviceType && enhancedVehicle && (
          <ServiceSchedulingModal
            isOpen={schedulingModal.isOpen}
            onClose={handleSchedulingModalClose}
            onSchedule={handleServiceScheduled}
            vehicle={enhancedVehicle}
            serviceType={schedulingModal.serviceType}
          />
        )}
      </div>
    </div>
  )
}