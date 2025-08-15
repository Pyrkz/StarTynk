'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Eye, 
  Edit, 
  Package, 
  Calendar, 
  MapPin, 
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { DeliveryListItem } from '../../types'
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
  DELIVERY_TYPE_LABELS,
  DELIVERY_TYPE_ICONS
} from '../../constants'
import {
  formatCurrency,
  formatWeight,
  formatDeliveryNumber,
  isDeliveryCompleted,
  isDeliveryPending,
  isDeliveryInProgress
} from '../../utils'

interface DeliveryTableProps {
  deliveries: DeliveryListItem[]
  pagination: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  isLoading?: boolean
  error?: string | null
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRefresh?: () => void
}

export const DeliveryTable: React.FC<DeliveryTableProps> = ({
  deliveries,
  pagination,
  isLoading = false,
  error = null,
  onPageChange,
  onPageSizeChange,
  onRefresh
}) => {
  const router = useRouter()
  
  const handleViewDelivery = (deliveryId: string) => {
    router.push(`/dashboard/dostawy/${deliveryId}`)
  }

  const handleEditDelivery = (deliveryId: string) => {
    // TODO: Open edit modal or navigate to edit page
    console.log('Edit delivery:', deliveryId)
  }

  const getStatusIcon = (status: string) => {
    if (isDeliveryCompleted(status as any)) {
      return <CheckCircle className="w-4 h-4 text-success-600" />
    }
    if (isDeliveryInProgress(status as any)) {
      return <Clock className="w-4 h-4 text-warning-600" />
    }
    if (isDeliveryPending(status as any)) {
      return <AlertCircle className="w-4 h-4 text-neutral-600" />
    }
    return <Package className="w-4 h-4 text-neutral-600" />
  }

  const getTypeIcon = (type: string) => {
    const iconName = DELIVERY_TYPE_ICONS[type as keyof typeof DELIVERY_TYPE_ICONS]
    // For now, just use Package icon for all types
    return <Package className="w-4 h-4 text-gray-600" />
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Numer / Dostawca
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Projekt
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Data dostawy
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Typ / Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Wartość / Waga
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Pozycje
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Odbiorca
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-900 w-32">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Brak dostaw
                  </h3>
                  <p className="text-gray-600">
                    Nie znaleziono dostaw spełniających kryteria wyszukiwania.
                  </p>
                </td>
              </tr>
            ) : (
              deliveries.map((delivery) => (
                <tr
                  key={delivery.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {/* Delivery Number & Supplier */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">
                        {formatDeliveryNumber(delivery.id)}
                      </div>
                      <div className="text-sm text-gray-600 truncate max-w-32">
                        {delivery.supplierName}
                      </div>
                    </div>
                  </td>

                  {/* Project */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      {delivery.project ? (
                        <>
                          <div className="font-medium text-gray-900 text-sm truncate max-w-36">
                            {delivery.project.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-36">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {delivery.project.address}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">Magazyn</div>
                      )}
                    </div>
                  </td>

                  {/* Delivery Date */}
                  <td className="py-4 px-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(delivery.deliveryDate).toLocaleDateString('pl-PL')}
                    </div>
                  </td>

                  {/* Type & Status */}
                  <td className="py-4 px-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        {getTypeIcon(delivery.deliveryType)}
                        <span className="ml-2">
                          {DELIVERY_TYPE_LABELS[delivery.deliveryType as keyof typeof DELIVERY_TYPE_LABELS]}
                        </span>
                      </div>
                      <div className="flex items-center">
                        {getStatusIcon(delivery.status)}
                        <Badge
                          variant={DELIVERY_STATUS_COLORS[delivery.status as keyof typeof DELIVERY_STATUS_COLORS]}
                          size="sm"
                          className="ml-2"
                        >
                          {DELIVERY_STATUS_LABELS[delivery.status as keyof typeof DELIVERY_STATUS_LABELS]}
                        </Badge>
                      </div>
                    </div>
                  </td>

                  {/* Value & Weight */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {formatCurrency(Number(delivery.totalValue || 0))}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatWeight(Number(delivery.totalWeight || 0))}
                      </div>
                    </div>
                  </td>

                  {/* Items Count */}
                  <td className="py-4 px-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {delivery._count.items}
                      </div>
                      <div className="text-xs text-gray-500">
                        {delivery.palletCount && `${delivery.palletCount} pal.`}
                        {delivery.packageCount && `${delivery.packageCount} pacz.`}
                      </div>
                    </div>
                  </td>

                  {/* Received By */}
                  <td className="py-4 px-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="truncate max-w-24">
                        {delivery.receivedBy.name}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDelivery(delivery.id)}
                        title="Zobacz szczegóły"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {isDeliveryPending(delivery.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDelivery(delivery.id)}
                          title="Edytuj dostawę"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Pokazuje {((pagination.currentPage - 1) * pagination.pageSize) + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} z {pagination.totalItems} wyników
            </div>
            
            <select
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={10}>10 na stronę</option>
              <option value={20}>20 na stronę</option>
              <option value={50}>50 na stronę</option>
              <option value={100}>100 na stronę</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number
                
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = pagination.currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.currentPage ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}