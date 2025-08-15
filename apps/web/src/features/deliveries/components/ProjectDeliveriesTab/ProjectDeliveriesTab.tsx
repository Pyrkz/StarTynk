'use client'

import React, { useState } from 'react'
import { RefreshCw, Search, Filter, Calendar, Truck, Package, AlertCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useMockProjectDeliveries } from '@/features/deliveries/hooks/useMockDeliveries'
import { DeliveryTable } from '@/features/deliveries/components/DeliveryTable'
import { DeliveryTableSkeleton } from '@/features/deliveries/components/DeliveryTable/DeliveryTableSkeleton'
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS, DELIVERY_TYPE_LABELS } from '@/features/deliveries/constants'
import type { DeliveryStatus, DeliveryType } from '@/features/deliveries/types'

interface ProjectDeliveriesTabProps {
  projectId: string
  projectName: string
}

export function ProjectDeliveriesTab({ projectId, projectName }: ProjectDeliveriesTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<DeliveryType | 'all'>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const {
    deliveries,
    pagination,
    statistics,
    loading,
    error,
    refetch,
    setPage,
    setPageSize
  } = useMockProjectDeliveries(projectId, {
    searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
    deliveryType: typeFilter === 'all' ? undefined : typeFilter,
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadgeVariant = (status: DeliveryStatus): 'neutral' | 'warning' | 'primary' | 'success' | 'danger' => {
    const variants: Record<DeliveryStatus, 'neutral' | 'warning' | 'primary' | 'success' | 'danger'> = {
      PENDING: 'warning',
      RECEIVED: 'primary',
      QUALITY_CHECK: 'warning',
      ACCEPTED: 'success',
      REJECTED: 'danger'
    }
    return variants[status]
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Truck className="w-5 h-5 text-neutral-500" />
            <Badge variant="neutral" size="sm">Wszystkie</Badge>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{statistics.total}</div>
          <div className="text-sm text-neutral-600">Wszystkie dostawy</div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-yellow-500" />
            <Badge variant="warning" size="sm">Oczekujące</Badge>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{statistics.pending}</div>
          <div className="text-sm text-neutral-600">Oczekujące dostawy</div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-green-500" />
            <Badge variant="success" size="sm">Zakończone</Badge>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{statistics.completed}</div>
          <div className="text-sm text-neutral-600">Zakończone dostawy</div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <Badge variant="primary" size="sm">Wartość</Badge>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{formatCurrency(statistics.totalValue)}</div>
          <div className="text-sm text-neutral-600">Całkowita wartość</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex flex-col space-y-4">
          {/* Search Bar and Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Szukaj po nazwie dostawcy lub numerze dostawy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && "bg-neutral-100")}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtry
                <ChevronDown className={cn("w-4 h-4 ml-1 transition-transform", showFilters && "rotate-180")} />
              </Button>
              
              <Button
                variant="outline"
                size="md"
                onClick={() => refetch()}
                disabled={loading}
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-neutral-200">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | 'all')}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">Wszystkie statusy</option>
                  {Object.entries(DELIVERY_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Typ dostawy
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as DeliveryType | 'all')}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">Wszystkie typy</option>
                  {Object.entries(DELIVERY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Data od
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Data do
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg border border-neutral-200">
        {loading ? (
          <DeliveryTableSkeleton />
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Błąd ładowania dostaw
            </h3>
            <p className="text-neutral-600 mb-4">{error}</p>
            <Button variant="primary" onClick={() => refetch()}>
              Spróbuj ponownie
            </Button>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Brak dostaw
            </h3>
            <p className="text-neutral-600">
              Nie znaleziono dostaw dla projektu "{projectName}"
            </p>
          </div>
        ) : (
          <DeliveryTable
            deliveries={deliveries}
            pagination={{
              currentPage: pagination.page,
              pageSize: pagination.limit,
              totalItems: pagination.total,
              totalPages: pagination.totalPages
            }}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  )
}