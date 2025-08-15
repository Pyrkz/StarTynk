'use client'

import { useState } from 'react'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FilterIcon,
  DownloadIcon,
  SearchIcon,
  FileTextIcon,
  CalendarIcon,
  DollarSignIcon,
  WrenchIcon,
  MoreHorizontalIcon,
  ExternalLinkIcon
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import type {
  ServiceRecordEnhanced,
  ServiceHistoryFiltersEnhanced,
  EnhancedServiceType
} from '@/types/fleet-enhanced'
import { translateServiceTypeEnhanced } from '@/types/fleet-enhanced'

interface ServiceHistoryTableProps {
  services: ServiceRecordEnhanced[]
  onViewDetails: (serviceId: string) => void
  onEditService: (serviceId: string) => void
  onExportData: () => void
  filters?: ServiceHistoryFiltersEnhanced
  onFiltersChange?: (filters: ServiceHistoryFiltersEnhanced) => void
  loading?: boolean
  className?: string
}

const ServiceHistoryTable: React.FC<ServiceHistoryTableProps> = ({
  services,
  onViewDetails,
  onEditService,
  onExportData,
  filters = {},
  onFiltersChange,
  loading = false,
  className = ''
}) => {
  const [showFilters, setShowFilters] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  const handleFilterChange = (key: keyof ServiceHistoryFiltersEnhanced, value: any) => {
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        [key]: value
      })
    }
  }

  const handleSort = (sortBy: ServiceHistoryFiltersEnhanced['sortBy']) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    handleFilterChange('sortBy', sortBy)
    handleFilterChange('sortOrder', newSortOrder)
  }

  const toggleRowExpansion = (serviceId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId)
    } else {
      newExpanded.add(serviceId)
    }
    setExpandedRows(newExpanded)
  }

  const getSortIcon = (column: ServiceHistoryFiltersEnhanced['sortBy']) => {
    if (filters.sortBy !== column) return null
    return filters.sortOrder === 'asc' ? 
      <ChevronUpIcon className="w-4 h-4" /> : 
      <ChevronDownIcon className="w-4 h-4" />
  }

  const getServiceTypeColor = (type: EnhancedServiceType) => {
    switch (type) {
      case 'ENGINE_OIL':
        return 'bg-blue-100 text-blue-800'
      case 'TRANSMISSION_OIL':
        return 'bg-purple-100 text-purple-800'
      case 'TECHNICAL_INSPECTION':
        return 'bg-green-100 text-green-800'
      case 'REPAIR':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredServices = services.filter(service => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      service.provider.toLowerCase().includes(searchLower) ||
      translateServiceTypeEnhanced(service.type).toLowerCase().includes(searchLower) ||
      service.notes?.toLowerCase().includes(searchLower) ||
      service.invoiceNumber?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Historia serwisów</h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredServices.length} {filteredServices.length === 1 ? 'serwis' : 'serwisów'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Szukaj serwisów..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
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
              variant="outline"
              size="sm"
              onClick={onExportData}
              className="flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              Eksport
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ serwisu
              </label>
              <select
                value={filters.serviceType || ''}
                onChange={(e) => handleFilterChange('serviceType', e.target.value || undefined)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Wszystkie</option>
                <option value="ENGINE_OIL">Olej silnikowy</option>
                <option value="TRANSMISSION_OIL">Olej przekładniowy</option>
                <option value="TECHNICAL_INSPECTION">Przegląd techniczny</option>
                <option value="REPAIR">Naprawa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data od
              </label>
              <input
                type="date"
                value={filters.dateFrom?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data do
              </label>
              <input
                type="date"
                value={filters.dateTo?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serwisant
              </label>
              <Input
                type="text"
                placeholder="Nazwa serwisu"
                value={filters.provider || ''}
                onChange={(e) => handleFilterChange('provider', e.target.value || undefined)}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Koszt: od{' '}
              <input
                type="number"
                placeholder="0"
                value={filters.costMin || ''}
                onChange={(e) => handleFilterChange('costMin', e.target.value ? Number(e.target.value) : undefined)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
              />
              {' '}do{' '}
              <input
                type="number"
                placeholder="10000"
                value={filters.costMax || ''}
                onChange={(e) => handleFilterChange('costMax', e.target.value ? Number(e.target.value) : undefined)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
              />
              {' '}zł
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange?.({})}
            >
              Wyczyść filtry
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Ładowanie historii serwisów...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-8 text-center">
            <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Brak historii serwisów</h4>
            <p className="text-gray-600">
              {searchTerm || Object.keys(filters).length > 0
                ? 'Nie znaleziono serwisów spełniających kryteria wyszukiwania.'
                : 'Ten pojazd nie ma jeszcze żadnych zapisów serwisowych.'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Data
                    {getSortIcon('date')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('type')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    <WrenchIcon className="w-4 h-4" />
                    Typ serwisu
                    {getSortIcon('type')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Przebieg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('provider')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Serwisant
                    {getSortIcon('provider')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('cost')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    <DollarSignIcon className="w-4 h-4" />
                    Koszt
                    {getSortIcon('cost')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.map((service) => (
                <>
                  <tr
                    key={service.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleRowExpansion(service.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleRowExpansion(service.id)
                          }}
                        >
                          {expandedRows.has(service.id) ? 
                            <ChevronUpIcon className="w-4 h-4" /> : 
                            <ChevronDownIcon className="w-4 h-4" />
                          }
                        </Button>
                        <div>
                          <p className="font-medium">
                            {service.date.toLocaleDateString('pl-PL')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {service.date.toLocaleDateString('pl-PL', { 
                              weekday: 'long'
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        className={`${getServiceTypeColor(service.type)}`}
                        variant="neutral"
                        size="sm"
                      >
                        {translateServiceTypeEnhanced(service.type)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.mileage ? (
                        <div>
                          <p className="font-medium">{service.mileage.toLocaleString()} km</p>
                          {service.nextDueMileage && (
                            <p className="text-xs text-gray-500">
                              Następny: {service.nextDueMileage.toLocaleString()} km
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{service.provider}</p>
                        {service.invoiceNumber && (
                          <p className="text-xs text-gray-500">
                            {service.invoiceNumber}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p className="font-medium">
                          {service.cost.toLocaleString('pl-PL', {
                            style: 'currency',
                            currency: 'PLN',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })}
                        </p>
                        {service.nextDueDate && (
                          <p className="text-xs text-gray-500">
                            Kolejny: {service.nextDueDate.toLocaleDateString('pl-PL')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="success" size="sm">
                        Zakończony
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onViewDetails(service.id)
                          }}
                        >
                          <ExternalLinkIcon className="w-4 h-4" />
                          Szczegóły
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <MoreHorizontalIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Row */}
                  {expandedRows.has(service.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Service Details */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Szczegóły serwisu</h4>
                            <div className="space-y-2 text-sm">
                              {Object.entries(service.details).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-500 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                  </span>
                                  <span className="text-gray-900 font-medium">
                                    {typeof value === 'boolean' ? (value ? 'Tak' : 'Nie') : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {service.notes && (
                              <div className="mt-4">
                                <h5 className="font-medium text-gray-700 mb-1">Notatki</h5>
                                <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                                  {service.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Photos and Documents */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Dokumentacja</h4>
                            <div className="space-y-3">
                              {service.invoiceNumber && (
                                <div className="flex items-center justify-between p-3 bg-white rounded border">
                                  <div className="flex items-center gap-2">
                                    <FileTextIcon className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium">
                                      Faktura {service.invoiceNumber}
                                    </span>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    <DownloadIcon className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                              {service.photos && service.photos.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                                    Zdjęcia ({service.photos.length})
                                  </h5>
                                  <div className="grid grid-cols-3 gap-2">
                                    {service.photos.slice(0, 3).map((photo, index) => (
                                      <div
                                        key={index}
                                        className="aspect-square bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-500"
                                      >
                                        Zdjęcie {index + 1}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {filteredServices.length > 0 && (
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between items-center text-sm">
            <div className="text-gray-600">
              Łączna wartość serwisów: {' '}
              <span className="font-medium text-gray-900">
                {filteredServices.reduce((sum, service) => sum + service.cost, 0)
                  .toLocaleString('pl-PL', {
                    style: 'currency',
                    currency: 'PLN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
              </span>
            </div>
            <div className="text-gray-600">
              Średni koszt serwisu: {' '}
              <span className="font-medium text-gray-900">
                {(filteredServices.reduce((sum, service) => sum + service.cost, 0) / filteredServices.length)
                  .toLocaleString('pl-PL', {
                    style: 'currency',
                    currency: 'PLN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceHistoryTable