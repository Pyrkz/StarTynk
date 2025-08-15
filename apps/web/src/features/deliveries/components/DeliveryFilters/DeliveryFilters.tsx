'use client'

import React from 'react'
import { Search, Calendar, Package, Building, User, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { DeliveryFiltersInput as DeliveryFiltersType } from '../../types'
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_TYPE_LABELS,
  DELIVERY_PRIORITY_LABELS
} from '../../constants'

interface DeliveryFiltersProps {
  filters: DeliveryFiltersType
  onChange: (filters: DeliveryFiltersType) => void
  onClear: () => void
}

export const DeliveryFilters: React.FC<DeliveryFiltersProps> = ({
  filters,
  onChange,
  onClear
}) => {
  const handleInputChange = (key: keyof DeliveryFiltersType, value: string | string[] | Date | boolean | null | undefined) => {
    onChange({
      ...filters,
      [key]: value
    })
  }

  const handleDateRangeChange = (type: 'from' | 'to', value: string) => {
    const currentRange = filters.dateRange || { from: new Date(), to: new Date() }
    
    onChange({
      ...filters,
      dateRange: {
        ...currentRange,
        [type]: new Date(value)
      }
    })
  }

  const removeFilter = (key: keyof DeliveryFiltersType) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onChange(newFilters)
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Wyszukaj
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Dostawca, projekt, numer..."
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => handleInputChange('status', e.target.value === 'ALL' ? undefined : e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">Wszystkie statusy</option>
            {Object.entries(DELIVERY_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Typ dostawy
          </label>
          <select
            value={filters.deliveryType || 'ALL'}
            onChange={(e) => handleInputChange('deliveryType', e.target.value === 'ALL' ? undefined : e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">Wszystkie typy</option>
            {Object.entries(DELIVERY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Supplier Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Dostawca
          </label>
          <input
            type="text"
            placeholder="Nazwa dostawcy"
            value={filters.supplierName || ''}
            onChange={(e) => handleInputChange('supplierName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Data od
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.dateRange?.from ? filters.dateRange.from.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateRangeChange('from', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Data do
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.dateRange?.to ? filters.dateRange.to.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateRangeChange('to', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Quality Control Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="qualityRequired"
            checked={filters.qualityCheckRequired || false}
            onChange={(e) => handleInputChange('qualityCheckRequired', e.target.checked ? true : undefined)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="qualityRequired" className="text-sm text-gray-700">
            Wymaga kontroli jakości
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="qualityCompleted"
            checked={filters.qualityCheckCompleted || false}
            onChange={(e) => handleInputChange('qualityCheckCompleted', e.target.checked ? true : undefined)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="qualityCompleted" className="text-sm text-gray-700">
            Kontrola zakończona
          </label>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Priorytet
          </label>
          <select
            value={filters.priorityLevel || 'ALL'}
            onChange={(e) => handleInputChange('priorityLevel', e.target.value === 'ALL' ? undefined : e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">Wszystkie priorytety</option>
            {Object.entries(DELIVERY_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Aktywne filtry:
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-gray-500 hover:text-gray-700"
            >
              Wyczyść wszystkie
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="neutral" className="flex items-center gap-1">
                Wyszukiwanie: &quot;{filters.search}&quot;
                <button
                  onClick={() => removeFilter('search')}
                  className="ml-1 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {filters.status && (
              <Badge variant="neutral" className="flex items-center gap-1">
                Status: {DELIVERY_STATUS_LABELS[filters.status as keyof typeof DELIVERY_STATUS_LABELS]}
                <button
                  onClick={() => removeFilter('status')}
                  className="ml-1 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {filters.deliveryType && (
              <Badge variant="neutral" className="flex items-center gap-1">
                Typ: {DELIVERY_TYPE_LABELS[filters.deliveryType as keyof typeof DELIVERY_TYPE_LABELS]}
                <button
                  onClick={() => removeFilter('deliveryType')}
                  className="ml-1 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {filters.supplierName && (
              <Badge variant="neutral" className="flex items-center gap-1">
                Dostawca: &quot;{filters.supplierName}&quot;
                <button
                  onClick={() => removeFilter('supplierName')}
                  className="ml-1 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {filters.dateRange && (
              <Badge variant="neutral" className="flex items-center gap-1">
                Okres: {filters.dateRange.from.toLocaleDateString('pl-PL')} - {filters.dateRange.to.toLocaleDateString('pl-PL')}
                <button
                  onClick={() => removeFilter('dateRange')}
                  className="ml-1 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {filters.qualityCheckRequired && (
              <Badge variant="neutral" className="flex items-center gap-1">
                Wymaga kontroli jakości
                <button
                  onClick={() => removeFilter('qualityCheckRequired')}
                  className="ml-1 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {filters.qualityCheckCompleted && (
              <Badge variant="neutral" className="flex items-center gap-1">
                Kontrola zakończona
                <button
                  onClick={() => removeFilter('qualityCheckCompleted')}
                  className="ml-1 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {filters.priorityLevel && (
              <Badge variant="neutral" className="flex items-center gap-1">
                Priorytet: {DELIVERY_PRIORITY_LABELS[filters.priorityLevel as keyof typeof DELIVERY_PRIORITY_LABELS]}
                <button
                  onClick={() => removeFilter('priorityLevel')}
                  className="ml-1 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}