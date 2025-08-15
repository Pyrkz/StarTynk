'use client'

import React from 'react'
import { 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Plus,
  Filter,
  Download,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
// import { useDeliveries, useDeliveryStats } from '../../hooks'
import { useMockDeliveries as useDeliveries } from '../../hooks'
import { DeliveryFilters } from '../DeliveryFilters'
import { DeliveryTable } from '../DeliveryTable'
import { DeliveryStatsCards } from '../DeliveryStatsCards'
import type { DeliveryFiltersInput as DeliveryFiltersType } from '../../types'

export const DeliveryDashboard: React.FC = () => {
  const [showFilters, setShowFilters] = React.useState(false)
  const [filters, setFilters] = React.useState<DeliveryFiltersType>({})

  const {
    deliveries,
    stats,
    isLoading,
    error,
    pagination,
    updateFilters,
    clearFilters,
    setPage,
    setPageSize,
    refresh
  } = useDeliveries({
    initialFilters: filters,
    autoFetch: true,
    pageSize: 20
  })

  const handleFiltersChange = (newFilters: DeliveryFiltersType) => {
    setFilters(newFilters)
    updateFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    clearFilters()
    setShowFilters(false)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export deliveries')
  }

  const handleCreateDelivery = () => {
    // TODO: Navigate to create delivery page or open modal
    console.log('Create new delivery')
  }

  const handleScheduleView = () => {
    // TODO: Navigate to calendar view
    window.location.href = '/dashboard/dostawy/kalendarz'
  }

  const handleReceiveDelivery = () => {
    // TODO: Navigate to receive delivery page
    window.location.href = '/dashboard/dostawy/odbiór'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dostawy</h1>
          <p className="text-gray-600 mt-1">
            Zarządzanie dostawami materiałów i sprzętu
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScheduleView}
            className="hidden sm:flex"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Kalendarz
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="hidden sm:flex"
          >
            <Download className="w-4 h-4 mr-2" />
            Eksport
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReceiveDelivery}
          >
            <Package className="w-4 h-4 mr-2" />
            Odbierz dostawę
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateDelivery}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nowa dostawa
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <DeliveryStatsCards stats={stats} isLoading={isLoading} />

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Deliveries */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Dzisiejsze dostawy
            </h3>
            <Badge variant="primary" size="sm">
              {deliveries.filter(d => {
                const today = new Date().toDateString()
                return new Date(d.deliveryDate).toDateString() === today
              }).length}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {deliveries
              .filter(d => {
                const today = new Date().toDateString()
                return new Date(d.deliveryDate).toDateString() === today
              })
              .slice(0, 5)
              .map(delivery => (
                <div key={delivery.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {delivery.supplierName}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {delivery.project?.name || 'Magazyn'}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      delivery.status === 'ACCEPTED' ? 'success' :
                      delivery.status === 'REJECTED' ? 'error' :
                      'warning'
                    }
                    size="sm"
                  >
                    {delivery.status}
                  </Badge>
                </div>
              ))}
            
            {deliveries.filter(d => {
              const today = new Date().toDateString()
              return new Date(d.deliveryDate).toDateString() === today
            }).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Brak dostaw na dziś
              </p>
            )}
          </div>
        </div>

        {/* Pending Quality Control */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Oczekujące kontrole
            </h3>
            <Badge variant="warning" size="sm">
              {deliveries.filter(d => d.status === 'QUALITY_CHECK').length}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {deliveries
              .filter(d => d.status === 'QUALITY_CHECK')
              .slice(0, 5)
              .map(delivery => (
                <div key={delivery.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {delivery.supplierName}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {new Date(delivery.deliveryDate).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-warning-600" />
                </div>
              ))}
            
            {deliveries.filter(d => d.status === 'QUALITY_CHECK').length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Brak oczekujących kontroli
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Ostatnia aktywność
            </h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {deliveries
              .filter(d => ['ACCEPTED', 'COMPLETED'].includes(d.status))
              .slice(0, 5)
              .map(delivery => (
                <div key={delivery.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {delivery.supplierName}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      Zakończono {new Date(delivery.deliveryDate).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-success-600" />
                </div>
              ))}
            
            {deliveries.filter(d => ['ACCEPTED', 'COMPLETED'].includes(d.status)).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Brak ostatniej aktywności
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtry
                {Object.keys(filters).length > 0 && (
                  <Badge variant="primary" size="sm" className="ml-2">
                    {Object.keys(filters).length}
                  </Badge>
                )}
              </Button>
              
              {Object.keys(filters).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Wyczyść filtry
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Wyników: {pagination.total}</span>
              {isLoading && <span>• Ładowanie...</span>}
              {error && <span className="text-error-600">• Błąd</span>}
            </div>
          </div>
        </div>
        
        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <DeliveryFilters
              filters={filters}
              onChange={handleFiltersChange}
              onClear={handleClearFilters}
            />
          </div>
        )}
        
        {/* Delivery Table */}
        <DeliveryTable
          deliveries={deliveries}
          isLoading={isLoading}
          error={error}
          pagination={{
            currentPage: pagination.page,
            pageSize: pagination.limit,
            totalItems: pagination.total,
            totalPages: pagination.totalPages
          }}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRefresh={refresh}
        />
      </div>
    </div>
  )
}