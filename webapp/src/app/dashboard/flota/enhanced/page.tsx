'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  AlertTriangleIcon,
  DollarSignIcon,
  TruckIcon,
  PlusIcon,
  GridIcon,
  ListIcon,
  FilterIcon,
  SearchIcon,
  CarIcon,
  UserIcon,
  MapPinIcon,
  RefreshCwIcon
} from 'lucide-react'
import { 
  EnhancedVehicleStatistics,
  FleetOverviewCard,
  FleetFilterOptions,
  getServiceAlertIcon,
} from '@/types/fleet-enhanced'
import { 
  translateVehicleStatus, 
  getVehicleDisplayName,
  translateVehicleType
} from '@/types/fleet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui'
import { VehicleCard } from '@/components/fleet/VehicleCard'
import { ServiceAlertBadge } from '@/components/fleet/ServiceAlertBadge'

type ViewMode = 'grid' | 'list' | 'calendar'

export default function EnhancedFlotaPage() {
  const [statistics, setStatistics] = useState<EnhancedVehicleStatistics | null>(null)
  const [vehicles, setVehicles] = useState<FleetOverviewCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FleetFilterOptions>({})
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const fetchFleetData = useCallback(async () => {
    setLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: viewMode === 'grid' ? '12' : '20',
        search: searchTerm,
      })

      if (filters.status?.length) {
        params.append('status', filters.status.join(','))
      }
      if (filters.serviceStatus?.length) {
        params.append('serviceStatus', filters.serviceStatus.join(','))
      }
      if (filters.assignmentType?.length) {
        params.append('assignmentType', filters.assignmentType.join(','))
      }

      // Fetch all data in parallel
      const [statsRes, vehiclesRes] = await Promise.all([
        fetch('/api/vehicles/statistics/enhanced'),
        fetch(`/api/vehicles/enhanced?${params}`),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStatistics(data)
      }

      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json()
        setVehicles(data.vehicles)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching fleet data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, filters, viewMode])

  useEffect(() => {
    fetchFleetData()
  }, [fetchFleetData])

  const handleScheduleService = (vehicleId: string) => {
    // Navigate to service scheduling page
    window.location.href = `/dashboard/flota/service/schedule?vehicleId=${vehicleId}`
  }

  const handleViewDetails = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (vehicle) {
      window.location.href = `/dashboard/flota/${vehicle.licensePlate}`
    }
  }

  const handleBulkSchedule = () => {
    const vehiclesWithAlerts = vehicles.filter(v => v.serviceAlerts.length > 0)
    const vehicleIds = vehiclesWithAlerts.map(v => v.id).join(',')
    window.location.href = `/dashboard/flota/service/bulk-schedule?vehicles=${vehicleIds}`
  }

  // Get all unique alerts for the alert widget
  const allAlerts = vehicles.flatMap(v => v.serviceAlerts)
  const criticalAlerts = allAlerts.filter(a => a.urgency === 'critical')
  const urgentAlerts = allAlerts.filter(a => a.urgency === 'urgent')
  const warningAlerts = allAlerts.filter(a => a.urgency === 'warning')

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Zarządzanie flotą</h1>
          <p className="text-gray-600 mt-1">
            Przegląd pojazdów z zarządzaniem serwisem
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={fetchFleetData}
            className="flex items-center gap-2"
          >
            <RefreshCwIcon className="w-4 h-4" />
            Odśwież
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard/flota/add'}
            size="md"
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Dodaj pojazd
          </Button>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TruckIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Flota ogółem</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statistics.total} pojazdów</p>
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <div>{statistics.active} aktywnych, {statistics.inService} w serwisie, {statistics.retired} wycofanych</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Alerty serwisowe</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statistics.alerts.total} alertów</p>
            <div className="mt-2 text-sm space-y-1">
              {statistics.alerts.critical > 0 && (
                <div className="text-red-600">{statistics.alerts.critical} krytycznych</div>
              )}
              {statistics.alerts.urgent > 0 && (
                <div className="text-orange-600">{statistics.alerts.urgent} pilnych</div>
              )}
              {statistics.alerts.warning > 0 && (
                <div className="text-yellow-600">{statistics.alerts.warning} ostrzeżeń</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Przypisania</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {statistics.assignedToEmployees + statistics.assignedToProjects} przypisanych
            </p>
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <div>{statistics.assignedToEmployees} do pracowników</div>
              <div>{statistics.assignedToProjects} do projektów</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSignIcon className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Koszty miesięczne</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {statistics.monthlyMetrics.costs.toLocaleString('pl-PL', {
                style: 'currency',
                currency: 'PLN',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-1">
                <span>Trend:</span>
                <span className={statistics.monthlyMetrics.trend > 0 ? 'text-red-600' : 'text-green-600'}>
                  {statistics.monthlyMetrics.trend > 0 ? '+' : ''}{statistics.monthlyMetrics.trend}%
                </span>
              </div>
              <div>
                Średnio: {statistics.monthlyMetrics.averageCostPerVehicle.toLocaleString('pl-PL', {
                  style: 'currency',
                  currency: 'PLN',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })} na pojazd
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Alerts Widget */}
      {allAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Priorytety serwisowe</h2>
            {vehicles.filter(v => v.serviceAlerts.length > 0).length > 1 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkSchedule}
              >
                Zaplanuj grupowo
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            {criticalAlerts.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangleIcon className="w-5 h-5" />
                  Krytyczne - wymagają natychmiastowej uwagi
                </h3>
                <div className="space-y-2">
                  {criticalAlerts.slice(0, 3).map((alert, index) => {
                    const vehicle = vehicles.find(v => v.id === alert.vehicleId)
                    if (!vehicle) return null
                    
                    return (
                      <div key={alert.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getServiceAlertIcon(alert.type)}</span>
                          <div>
                            <p className="font-medium text-gray-900">
                              {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                            </p>
                            <p className="text-sm text-red-700">{alert.message}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ServiceAlertBadge
                            urgency={alert.urgency}
                            status={alert.status}
                            remainingValue={alert.remainingValue}
                            isDistanceBased={alert.isDistanceBased}
                          />
                          <Button 
                            size="sm" 
                            variant="primary"
                            onClick={() => handleScheduleService(vehicle.id)}
                          >
                            Zaplanuj
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  {criticalAlerts.length > 3 && (
                    <p className="text-sm text-red-700 mt-2">
                      + {criticalAlerts.length - 3} więcej krytycznych alertów
                    </p>
                  )}
                </div>
              </div>
            )}

            {urgentAlerts.length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                  <AlertTriangleIcon className="w-5 h-5" />
                  Pilne - zaplanuj w ciągu 7 dni
                </h3>
                <div className="space-y-2">
                  {urgentAlerts.slice(0, 2).map((alert, index) => {
                    const vehicle = vehicles.find(v => v.id === alert.vehicleId)
                    if (!vehicle) return null
                    
                    return (
                      <div key={alert.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getServiceAlertIcon(alert.type)}</span>
                          <div>
                            <p className="font-medium text-gray-900">
                              {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                            </p>
                            <p className="text-sm text-orange-700">{alert.message}</p>
                          </div>
                        </div>
                        <ServiceAlertBadge
                          urgency={alert.urgency}
                          status={alert.status}
                          remainingValue={alert.remainingValue}
                          isDistanceBased={alert.isDistanceBased}
                        />
                      </div>
                    )
                  })}
                  {urgentAlerts.length > 2 && (
                    <p className="text-sm text-orange-700 mt-2">
                      + {urgentAlerts.length - 2} więcej pilnych alertów
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fleet View Controls */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Lista pojazdów</h2>
              
              {/* View Mode Switcher */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <GridIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1 lg:w-64">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Szukaj pojazdu..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <FilterIcon className="w-4 h-4" />
                Filtry
                {Object.keys(filters).length > 0 && (
                  <Badge variant="primary" size="xs">{Object.keys(filters).length}</Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status pojazdu
                </label>
                <select
                  multiple
                  value={filters.status || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                    setFilters(prev => ({ ...prev, status: selected as any }))
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Aktywne</option>
                  <option value="MAINTENANCE">W serwisie</option>
                  <option value="RETIRED">Wycofane</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status serwisu
                </label>
                <select
                  multiple
                  value={filters.serviceStatus || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                    setFilters(prev => ({ ...prev, serviceStatus: selected as any }))
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="up_to_date">Aktualny</option>
                  <option value="due_soon">Zbliża się</option>
                  <option value="overdue">Zaległy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Przypisanie
                </label>
                <select
                  multiple
                  value={filters.assignmentType || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                    setFilters(prev => ({ ...prev, assignmentType: selected as any }))
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unassigned">Nieprzypisany</option>
                  <option value="employee">Pracownik</option>
                  <option value="project">Projekt</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Vehicles Display */}
        {viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onScheduleService={handleScheduleService}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                    Przypisany do
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alerty serwisowe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Następny serwis
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <CarIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {getVehicleDisplayName(vehicle)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {vehicle.licensePlate} • {translateVehicleType(vehicle.type)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        vehicle.status === 'ACTIVE' ? 'success' :
                        vehicle.status === 'MAINTENANCE' ? 'warning' : 'error'
                      }>
                        {translateVehicleStatus(vehicle.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.currentAssignment ? (
                        <div className="flex items-center gap-2 text-sm">
                          {vehicle.currentAssignment.type === 'employee' ? (
                            <UserIcon className="w-4 h-4 text-gray-400" />
                          ) : (
                            <MapPinIcon className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-gray-900">
                            {vehicle.currentAssignment.assignedTo}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Nieprzypisany</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {vehicle.quickStats.criticalAlerts > 0 && (
                          <Badge variant="error" size="sm">
                            {vehicle.quickStats.criticalAlerts} krytyczne
                          </Badge>
                        )}
                        {vehicle.quickStats.totalAlerts - vehicle.quickStats.criticalAlerts > 0 && (
                          <Badge variant="warning" size="sm">
                            {vehicle.quickStats.totalAlerts - vehicle.quickStats.criticalAlerts} inne
                          </Badge>
                        )}
                        {vehicle.quickStats.totalAlerts === 0 && (
                          <Badge variant="success" size="sm">
                            Aktualny
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        const nextService = vehicle.serviceAlerts
                          .filter(a => a.isDistanceBased)
                          .sort((a, b) => a.remainingValue - b.remainingValue)[0]
                        
                        if (nextService) {
                          return (
                            <div className="flex items-center gap-2">
                              <span>{getServiceAlertIcon(nextService.type)}</span>
                              <span className={
                                nextService.status === 'overdue' ? 'text-red-600' :
                                nextService.status === 'due_soon' ? 'text-orange-600' :
                                'text-gray-600'
                              }>
                                {nextService.status === 'overdue' 
                                  ? `Zaległe ${Math.abs(nextService.remainingValue)} km`
                                  : `Za ${nextService.remainingValue} km`
                                }
                              </span>
                            </div>
                          )
                        }
                        
                        return '-'
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {vehicle.serviceAlerts.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleScheduleService(vehicle.id)}
                          >
                            Serwis
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(vehicle.id)}
                        >
                          Szczegóły
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Strona {currentPage} z {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Poprzednia
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Następna
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}