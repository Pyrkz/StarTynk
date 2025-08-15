'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MoreVerticalIcon,
  AlertTriangleIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon
} from 'lucide-react'
import type { 
  VehicleStatistics, 
  UpcomingReminder, 
  VehicleCostSummary
} from '@/types/fleet'
import type {
  EnhancedServiceType
} from '@/types/fleet-enhanced'
import { 
  translateReminderType,
  getVehicleStatusColor,
  translateVehicleStatus
} from '@/types/fleet'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui'
import ServiceSchedulingModal from '@/components/fleet/ServiceSchedulingModal'
import ServiceTabsManager from '@/components/fleet/ServiceTabsManager'
import { useServiceManagement } from '@/hooks/fleet/useServiceManagement'

export default function FlotaPage() {
  const router = useRouter()
  const [statistics, setStatistics] = useState<VehicleStatistics | null>(null)
  const [reminders, setReminders] = useState<UpcomingReminder[]>([])
  const [costs, setCosts] = useState<VehicleCostSummary[]>([])
  const [, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Service management integration
  const {
    vehicles,
    scheduleService,
    markServiceComplete,
    getVehicleByLicensePlate,
    loading: serviceLoading
  } = useServiceManagement()

  // Service scheduling modal state
  const [schedulingModal, setSchedulingModal] = useState<{
    isOpen: boolean
    vehicleId?: string
    serviceType?: EnhancedServiceType
  }>({
    isOpen: false
  })

  const fetchFleetData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, remindersRes, costsRes] = await Promise.all([
        fetch('/api/vehicles/statistics'),
        fetch('/api/vehicles/reminders?limit=5'),
        fetch('/api/vehicles/costs?period=month'),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStatistics(data)
      }

      if (remindersRes.ok) {
        const data = await remindersRes.json()
        setReminders(data)
      }

      if (costsRes.ok) {
        const data = await costsRes.json()
        setCosts(data.vehicles)
      }
    } catch (error) {
      console.error('Error fetching fleet data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFleetData()
  }, [fetchFleetData])

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

  const handleSchedulingModalClose = useCallback(() => {
    setSchedulingModal({ isOpen: false })
  }, [])

  const handleVehicleClick = (vehicleId: string) => {
    router.push(`/dashboard/flota/${vehicleId}`)
  }


  const filteredVehicles = vehicles.filter(vehicle => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      vehicle.licensePlate.toLowerCase().includes(query) ||
      vehicle.make.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Flota pojazdów</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Zarządzaj pojazdami i planuj serwisy
                </p>
              </div>
              <Button
                onClick={() => {/* TODO: Navigate to add vehicle page */}}
                className="text-sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Dodaj pojazd
              </Button>
            </div>
          </div>

          {/* Statistics Bar */}
          {statistics && (
            <div className="grid grid-cols-4 gap-6 pb-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
                <p className="text-sm text-gray-500">Wszystkie pojazdy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{statistics.active}</p>
                <p className="text-sm text-gray-500">Aktywne</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-orange-600">{statistics.inMaintenance}</p>
                <p className="text-sm text-gray-500">W serwisie</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-red-600">
                  {statistics.dueForService + statistics.dueForInspection + statistics.dueForInsurance}
                </p>
                <p className="text-sm text-gray-500">Wymaga uwagi</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        {/* Search and Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Szukaj po numerze rejestracyjnym, marce lub modelu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button variant="outline" className="text-sm">
            <FilterIcon className="w-4 h-4 mr-2" />
            Filtry
          </Button>
        </div>

        {/* Alerts Section */}
        {reminders.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start">
              <AlertTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Nadchodzące terminy ({reminders.length})
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  {reminders.slice(0, 3).map((reminder, index) => (
                    <div key={reminder.id}>
                      {reminder.vehicle.licensePlate} - {translateReminderType(reminder.type)} 
                      {reminder.daysUntilDue === 0 ? ' (dziś)' : 
                       reminder.daysUntilDue === 1 ? ' (jutro)' : 
                       ` (za ${reminder.daysUntilDue} dni)`}
                      {index < 2 && index < reminders.length - 1 && ', '}
                    </div>
                  ))}
                  {reminders.length > 3 && (
                    <button className="text-yellow-800 underline mt-1">
                      Zobacz wszystkie →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service Tabs Manager */}
        <ServiceTabsManager
          vehicles={filteredVehicles}
          onScheduleService={handleServiceScheduled}
          onMarkServiceComplete={async (serviceId: string) => {
            await markServiceComplete(serviceId)
            return true
          }}
          loading={serviceLoading}
        />

        {/* Service Scheduling Modal */}
        {schedulingModal.isOpen && schedulingModal.vehicleId && schedulingModal.serviceType && (
          <ServiceSchedulingModal
            isOpen={schedulingModal.isOpen}
            onClose={handleSchedulingModalClose}
            onSchedule={handleServiceScheduled}
            vehicle={getVehicleByLicensePlate(schedulingModal.vehicleId)!}
            serviceType={schedulingModal.serviceType}
          />
        )}
      </div>
    </div>
  )
}