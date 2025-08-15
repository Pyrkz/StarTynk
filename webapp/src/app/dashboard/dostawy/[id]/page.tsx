'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Package, 
  Truck,
  User,
  MapPin,
  Calendar,
  Phone,
  FileText,
  Camera,
  CheckCircle,
  AlertTriangle,
  Clock,
  Edit,
  Download,
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useMockDelivery } from '@/features/deliveries/hooks'
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
  DELIVERY_TYPE_LABELS,
  DELIVERY_PRIORITY_LABELS,
  DELIVERY_PRIORITY_COLORS,
  ITEM_QUALITY_STATUS_LABELS,
  ITEM_QUALITY_STATUS_COLORS
} from '@/features/deliveries/constants'

export default function DeliveryDetailsPage() {
  const params = useParams()
  const deliveryId = params.id as string
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'quality' | 'photos' | 'history'>('details')

  const { delivery, isLoading, error } = useMockDelivery(deliveryId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !delivery) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">
          {error || 'Nie znaleziono dostawy'}
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/dostawy">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót do listy dostaw
          </Link>
        </Button>
      </div>
    )
  }

  const tabs = [
    { id: 'details', label: 'Szczegóły', icon: FileText },
    { id: 'items', label: 'Pozycje', icon: Package, count: delivery.items?.length || 0 },
    { id: 'quality', label: 'Kontrola jakości', icon: CheckCircle },
    { id: 'photos', label: 'Zdjęcia', icon: Camera, count: delivery.photos?.length || 0 },
    { id: 'history', label: 'Historia', icon: Clock },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/dostawy">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót
              </Link>
            </Button>
            <div className="border-l border-gray-300 h-6" />
            <h1 className="text-2xl font-bold text-gray-900">
              Dostawa #{delivery.id}
            </h1>
            <Badge className={cn(DELIVERY_STATUS_COLORS[delivery.status])}>
              {DELIVERY_STATUS_LABELS[delivery.status]}
            </Badge>
            <Badge className={cn(DELIVERY_PRIORITY_COLORS[delivery.priority])}>
              {DELIVERY_PRIORITY_LABELS[delivery.priority]}
            </Badge>
          </div>
          <p className="text-gray-600">
            Dostawca: {delivery.supplierName} • {delivery.deliveryDate.toLocaleDateString('pl-PL')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            E-mail
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Eksport
          </Button>
          <Button variant="secondary" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edytuj
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Wartość dostawy</div>
          <div className="text-2xl font-bold text-gray-900">
            {delivery.totalValue?.toLocaleString('pl-PL', {
              style: 'currency',
              currency: delivery.currency || 'PLN'
            }) || 'Nie określono'}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Pozycje</div>
          <div className="text-2xl font-bold text-gray-900">
            {delivery._count?.items || delivery.items?.length || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Masa całkowita</div>
          <div className="text-2xl font-bold text-gray-900">
            {delivery.totalWeight ? `${delivery.totalWeight} kg` : 'Nie określono'}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Projekt</div>
          <div className="text-lg font-semibold text-gray-900">
            {delivery.project?.name || 'Magazyn'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <Badge variant="secondary" size="sm">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'details' && <DetailsTab delivery={delivery} />}
          {activeTab === 'items' && <ItemsTab delivery={delivery} />}
          {activeTab === 'quality' && <QualityTab delivery={delivery} />}
          {activeTab === 'photos' && <PhotosTab delivery={delivery} />}
          {activeTab === 'history' && <HistoryTab delivery={delivery} />}
        </div>
      </div>
    </div>
  )
}

// Tab Components
function DetailsTab({ delivery }: { delivery: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Delivery Information */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informacje o dostawie</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Numer dostawy:</dt>
              <dd className="text-sm font-medium text-gray-900">{delivery.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Typ dostawy:</dt>
              <dd className="text-sm font-medium text-gray-900">
                {DELIVERY_TYPE_LABELS[delivery.deliveryType]}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Data dostawy:</dt>
              <dd className="text-sm font-medium text-gray-900">
                {delivery.deliveryDate.toLocaleDateString('pl-PL')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Adres dostawy:</dt>
              <dd className="text-sm font-medium text-gray-900">
                {delivery.deliveryAddress || delivery.project?.address || 'Magazyn główny'}
              </dd>
            </div>
            {delivery.palletCount && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Liczba palet:</dt>
                <dd className="text-sm font-medium text-gray-900">{delivery.palletCount}</dd>
              </div>
            )}
            {delivery.packageCount && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Liczba paczek:</dt>
                <dd className="text-sm font-medium text-gray-900">{delivery.packageCount}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Driver and Vehicle */}
        {(delivery.driverName || delivery.vehiclePlate) && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Kierowca i pojazd</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {delivery.driverName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    <span className="font-medium">Kierowca: </span>
                    {delivery.driverName}
                  </span>
                </div>
              )}
              {delivery.driverPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{delivery.driverPhone}</span>
                </div>
              )}
              {delivery.vehiclePlate && (
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{delivery.vehiclePlate}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {delivery.notes && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Uwagi</h4>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {delivery.notes}
            </p>
          </div>
        )}
      </div>

      {/* Supplier and Project */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dostawca i projekt</h3>
          
          {/* Supplier */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">📦 Dostawca</h4>
            <div className="text-sm text-gray-600">
              <div className="font-medium">{delivery.supplierName}</div>
              {delivery.supplierContact && <div>{delivery.supplierContact}</div>}
            </div>
          </div>

          {/* Project */}
          {delivery.project && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">🏗️ Projekt</h4>
              <div className="text-sm text-gray-600">
                <div className="font-medium">{delivery.project.name}</div>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {delivery.project.address}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Received By */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">👤 Odebrane przez</h4>
          <div className="text-sm text-gray-600">
            <div className="font-medium">{delivery.receivedBy.name}</div>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              {delivery.createdAt.toLocaleDateString('pl-PL')}
            </div>
          </div>
        </div>

        {/* Times */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Czasy</h4>
          <div className="space-y-2">
            {delivery.arrivalTime && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Przyjazd:</span>
                <span className="font-medium">{delivery.arrivalTime.toLocaleString('pl-PL')}</span>
              </div>
            )}
            {delivery.completionTime && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Zakończenie:</span>
                <span className="font-medium">{delivery.completionTime.toLocaleString('pl-PL')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ItemsTab({ delivery }: { delivery: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Pozycje w dostawie</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pozycja
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ilość
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cena jednostkowa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wartość
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status jakości
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {delivery.items?.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.itemName}
                    </div>
                    {item.material?.description && (
                      <div className="text-sm text-gray-500">
                        {item.material.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div>Zamówiono: {item.orderedQuantity} {item.unit}</div>
                    <div className="text-green-600">
                      Dostarczono: {item.deliveredQuantity} {item.unit}
                    </div>
                    {item.acceptedQuantity !== undefined && (
                      <div className="text-blue-600">
                        Przyjęto: {item.acceptedQuantity} {item.unit}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.unitPrice ? `${item.unitPrice.toFixed(2)} ${delivery.currency || 'PLN'}` : 'Nie określono'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.totalPrice ? `${item.totalPrice.toFixed(2)} ${delivery.currency || 'PLN'}` : 'Nie określono'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={cn(ITEM_QUALITY_STATUS_COLORS[item.qualityStatus])}>
                    {ITEM_QUALITY_STATUS_LABELS[item.qualityStatus]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {delivery.totalValue && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Łączna wartość dostawy:</span>
            <span>{delivery.totalValue.toFixed(2)} {delivery.currency || 'PLN'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function QualityTab({ delivery }: { delivery: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Kontrola jakości</h3>
        <Button variant="outline">
          <CheckCircle className="w-4 h-4 mr-2" />
          Przeprowadź kontrolę
        </Button>
      </div>
      
      {delivery.qualityCheckRequired ? (
        <div className="space-y-4">
          {delivery.items?.map((item: any) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{item.itemName}</h4>
                <Badge className={cn(ITEM_QUALITY_STATUS_COLORS[item.qualityStatus])}>
                  {ITEM_QUALITY_STATUS_LABELS[item.qualityStatus]}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Dostarczone: </span>
                  <span className="font-medium">{item.deliveredQuantity} {item.unit}</span>
                </div>
                {item.acceptedQuantity !== undefined && (
                  <div>
                    <span className="text-gray-600">Przyjęte: </span>
                    <span className="font-medium text-green-600">{item.acceptedQuantity} {item.unit}</span>
                  </div>
                )}
                {item.rejectedQuantity !== undefined && item.rejectedQuantity > 0 && (
                  <div>
                    <span className="text-gray-600">Odrzucone: </span>
                    <span className="font-medium text-red-600">{item.rejectedQuantity} {item.unit}</span>
                  </div>
                )}
              </div>
              
              {item.qualityNotes && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                  <span className="font-medium text-gray-900">Uwagi: </span>
                  {item.qualityNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Kontrola jakości nie wymagana</h4>
          <p className="text-gray-600">
            Ta dostawa nie wymaga przeprowadzenia kontroli jakości.
          </p>
        </div>
      )}
    </div>
  )
}

function PhotosTab({ delivery }: { delivery: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Zdjęcia dostawy</h3>
        <Button variant="outline">
          <Camera className="w-4 h-4 mr-2" />
          Dodaj zdjęcie
        </Button>
      </div>
      
      {delivery.photos && delivery.photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {delivery.photos.map((photo: any, index: number) => (
            <div key={photo.id || index} className="bg-gray-100 aspect-square rounded-lg flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
              <div className="absolute bottom-2 left-2 right-2">
                <div className="text-xs text-white bg-black bg-opacity-50 rounded px-2 py-1">
                  {photo.description || photo.photoType}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Brak zdjęć</h4>
          <p className="text-gray-600 mb-4">
            Nie dodano jeszcze żadnych zdjęć do tej dostawy.
          </p>
          <Button variant="outline">
            Dodaj pierwsze zdjęcie
          </Button>
        </div>
      )}
    </div>
  )
}

function HistoryTab({ delivery }: { delivery: any }) {
  const mockHistory = [
    {
      id: '1',
      status: 'PENDING',
      date: new Date(delivery.createdAt),
      user: 'System',
      description: 'Dostawa utworzona w systemie'
    },
    {
      id: '2', 
      status: 'RECEIVED',
      date: new Date(delivery.createdAt.getTime() + 3600000),
      user: delivery.receivedBy.name,
      description: 'Dostawa odebrana i zarejestrowana'
    }
  ]
  
  if (delivery.status !== 'PENDING') {
    mockHistory.push({
      id: '3',
      status: delivery.status,
      date: new Date(delivery.updatedAt || delivery.createdAt),
      user: delivery.receivedBy.name,
      description: `Status zmieniony na ${DELIVERY_STATUS_LABELS[delivery.status]}`
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Historia zmian</h3>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {mockHistory.map((entry, entryIdx) => (
            <li key={entry.id}>
              <div className="relative pb-8">
                {entryIdx !== mockHistory.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                      <Clock className="w-4 h-4 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{entry.user}</span>{' '}
                        - {entry.description}
                      </p>
                      <Badge className={cn(DELIVERY_STATUS_COLORS[entry.status as keyof typeof DELIVERY_STATUS_COLORS], 'mt-1')}>
                        {DELIVERY_STATUS_LABELS[entry.status as keyof typeof DELIVERY_STATUS_LABELS]}
                      </Badge>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={entry.date.toISOString()}>
                        {entry.date.toLocaleDateString('pl-PL')}<br/>
                        {entry.date.toLocaleTimeString('pl-PL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}