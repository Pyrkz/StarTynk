'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { 
  MaterialOrder, 
  OrderItemStatus 
} from '@/types/materials';
import { 
  ORDER_STATUS_COLORS, 
  ORDER_STATUS_LABELS, 
  ORDER_STATUS_ICONS,
  ORDER_PRIORITY_COLORS,
  ORDER_PRIORITY_LABELS 
} from '@/types/materials';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'history' | 'documents'>('details');

  // Mock order data - replace with real API call
  const mockOrder: MaterialOrder = {
    id: orderId,
    orderNumber: 'ORD-2024-001',
    projectId: 'proj-1',
    orderedById: 'user-1',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    deliveryType: 'TO_SITE',
    totalAmount: 15420.50,
    currency: 'PLN',
    orderDate: new Date('2024-01-15'),
    neededDate: new Date('2024-01-20'),
    requestedDeliveryDate: new Date('2024-01-19'),
    deliveryAddress: 'ul. Słoneczna 15, Warszawa - Budynek A, II piętro',
    notes: 'Pilne zamówienie materiałów do wykończenia. Proszę o dostawę w godzinach 8:00-14:00.',
    internalNotes: 'Klient płaci gotówką. Sprawdzić dostępność przed dostawą.',
    budgetCode: 'BUD-2024-A-001',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
    project: {
      id: 'proj-1',
      name: 'Osiedle Słoneczne - Budynek A',
      address: 'ul. Słoneczna 15, Warszawa'
    },
    orderedBy: {
      id: 'user-1',
      name: 'Jan Kowalski',
      email: 'jan.kowalski@example.com'
    },
    approvedBy: {
      id: 'manager-1',
      name: 'Anna Nowak',
      email: 'anna.nowak@example.com'
    },
    items: [
      {
        id: 'item-1',
        orderId,
        materialId: 'mat-1',
        requestedQuantity: 100,
        approvedQuantity: 100,
        deliveredQuantity: 60,
        unitPrice: 18.50,
        totalPrice: 1850.00,
        status: 'PARTIALLY_DELIVERED',
        estimatedDeliveryDate: new Date('2024-01-19'),
        notes: 'Pierwsza dostawa 60 worków, reszta w następnej partii',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-17'),
        material: {
          id: 'mat-1',
          name: 'Cement Portland CEM I 42,5R',
          categoryId: 'cat-1',
          unit: 'worek 25kg',
          price: 18.50,
          stockLevel: 150,
          minStock: 50,
          reservedStock: 40,
          isOrderable: true,
          requiresApproval: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          description: 'Wysokiej jakości cement portlandzki'
        }
      },
      {
        id: 'item-2',
        orderId,
        materialId: 'mat-2',
        requestedQuantity: 5,
        approvedQuantity: 5,
        deliveredQuantity: 5,
        unitPrice: 45.00,
        totalPrice: 225.00,
        status: 'DELIVERED',
        actualDeliveryDate: new Date('2024-01-16'),
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16'),
        material: {
          id: 'mat-2',
          name: 'Młotek murarski 500g',
          categoryId: 'cat-2',
          unit: 'szt',
          price: 45.00,
          stockLevel: 25,
          minStock: 10,
          reservedStock: 0,
          isOrderable: true,
          requiresApproval: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          description: 'Profesjonalny młotek murarski'
        }
      },
      {
        id: 'item-3',
        orderId,
        materialId: 'mat-4',
        requestedQuantity: 20,
        approvedQuantity: 15,
        deliveredQuantity: 0,
        unitPrice: 65.00,
        totalPrice: 975.00,
        status: 'ORDERED',
        estimatedDeliveryDate: new Date('2024-01-20'),
        notes: 'Zmniejszono ilość z 20 na 15 wiadr ze względu na budżet',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16'),
        material: {
          id: 'mat-4',
          name: 'Farba emulsyjna biała 10L',
          categoryId: 'cat-4',
          unit: 'wiadro 10L',
          price: 65.00,
          stockLevel: 40,
          minStock: 20,
          reservedStock: 15,
          isOrderable: true,
          requiresApproval: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          description: 'Wysokiej jakości farba emulsyjna'
        }
      }
    ],
    statusHistory: [
      {
        id: 'hist-1',
        orderId,
        fromStatus: undefined,
        toStatus: 'NEW',
        changedAt: new Date('2024-01-15T08:30:00'),
        reason: 'Zamówienie utworzone przez pracownika',
        changedBy: {
          id: 'user-1',
          name: 'Jan Kowalski',
          email: 'jan.kowalski@example.com'
        }
      },
      {
        id: 'hist-2',
        orderId,
        fromStatus: 'NEW',
        toStatus: 'APPROVED',
        changedAt: new Date('2024-01-15T10:15:00'),
        reason: 'Zamówienie zatwierdzone przez kierownika',
        notes: 'Zatwierdzam z uwagą na termin dostawy',
        changedBy: {
          id: 'manager-1',
          name: 'Anna Nowak',
          email: 'anna.nowak@example.com'
        }
      },
      {
        id: 'hist-3',
        orderId,
        fromStatus: 'APPROVED',
        toStatus: 'IN_PROGRESS',
        changedAt: new Date('2024-01-15T14:20:00'),
        reason: 'Zamówienie przekazane do realizacji',
        notes: 'Skontaktowano się z dostawcami',
        changedBy: {
          id: 'procurement-1',
          name: 'Michał Zieliński',
          email: 'michal.zielinski@example.com'
        }
      }
    ]
  };

  const getItemStatusColor = (status: OrderItemStatus): string => {
    const colors: Record<OrderItemStatus, string> = {
      PENDING: 'bg-gray-100 text-gray-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      SOURCING: 'bg-yellow-100 text-yellow-800',
      ORDERED: 'bg-orange-100 text-orange-800',
      IN_TRANSIT: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      PARTIALLY_DELIVERED: 'bg-orange-100 text-orange-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      OUT_OF_STOCK: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getItemStatusLabel = (status: OrderItemStatus): string => {
    const labels: Record<OrderItemStatus, string> = {
      PENDING: 'Oczekuje',
      APPROVED: 'Zatwierdzone',
      SOURCING: 'Poszukiwanie dostawcy',
      ORDERED: 'Zamówione',
      IN_TRANSIT: 'W drodze',
      DELIVERED: 'Dostarczone',
      PARTIALLY_DELIVERED: 'Częściowo dostarczone',
      CANCELLED: 'Anulowane',
      OUT_OF_STOCK: 'Brak w magazynie',
    };
    return labels[status];
  };

  const calculateProgress = () => {
    if (!mockOrder.items || mockOrder.items.length === 0) return 0;
    
    const totalItems = mockOrder.items.length;
    const deliveredItems = mockOrder.items.filter(item => 
      item.status === 'DELIVERED' || item.status === 'PARTIALLY_DELIVERED'
    ).length;
    
    return Math.round((deliveredItems / totalItems) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Zamówienie {mockOrder.orderNumber}
            </h1>
            <Badge className={cn(ORDER_STATUS_COLORS[mockOrder.status])}>
              {ORDER_STATUS_ICONS[mockOrder.status]} {ORDER_STATUS_LABELS[mockOrder.status]}
            </Badge>
            <Badge className={cn(ORDER_PRIORITY_COLORS[mockOrder.priority])}>
              {ORDER_PRIORITY_LABELS[mockOrder.priority]}
            </Badge>
          </div>
          <p className="text-gray-600">
            Utworzone {mockOrder.orderDate.toLocaleDateString('pl-PL')} przez {mockOrder.orderedBy?.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            📧 Wyślij e-mail
          </Button>
          <Button variant="outline">
            🖨️ Drukuj
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/zamowienia">
              ← Powrót
            </Link>
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-lg shadow-elevation-medium p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Postęp realizacji</h2>
          <span className="text-sm text-gray-600">{progress}% ukończone</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Rozpoczęte</span>
          <span>W trakcie</span>
          <span>Ukończone</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-elevation-medium p-6">
          <div className="text-sm text-gray-600 mb-1">Wartość zamówienia</div>
          <div className="text-2xl font-bold text-gray-900">
            {mockOrder.totalAmount?.toLocaleString('pl-PL', {
              style: 'currency',
              currency: mockOrder.currency
            })}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-elevation-medium p-6">
          <div className="text-sm text-gray-600 mb-1">Pozycje w zamówieniu</div>
          <div className="text-2xl font-bold text-gray-900">
            {mockOrder.items?.length || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-elevation-medium p-6">
          <div className="text-sm text-gray-600 mb-1">Data potrzeby</div>
          <div className="text-lg font-semibold text-gray-900">
            {mockOrder.neededDate?.toLocaleDateString('pl-PL') || 'Nie określono'}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-elevation-medium p-6">
          <div className="text-sm text-gray-600 mb-1">Projekt</div>
          <div className="text-lg font-semibold text-gray-900">
            {mockOrder.project?.name || 'Brak projektu'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-elevation-medium">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'details', label: 'Szczegóły', icon: '📋' },
              { id: 'items', label: 'Pozycje', icon: '📦' },
              { id: 'history', label: 'Historia', icon: '📅' },
              { id: 'documents', label: 'Dokumenty', icon: '📄' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informacje o zamówieniu</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Numer zamówienia:</dt>
                      <dd className="text-sm font-medium text-gray-900">{mockOrder.orderNumber}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Status:</dt>
                      <dd>
                        <Badge className={cn(ORDER_STATUS_COLORS[mockOrder.status])}>
                          {ORDER_STATUS_LABELS[mockOrder.status]}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Priorytet:</dt>
                      <dd>
                        <Badge className={cn(ORDER_PRIORITY_COLORS[mockOrder.priority])}>
                          {ORDER_PRIORITY_LABELS[mockOrder.priority]}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Data zamówienia:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {mockOrder.orderDate.toLocaleDateString('pl-PL')}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Data potrzeby:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {mockOrder.neededDate?.toLocaleDateString('pl-PL') || 'Nie określono'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Typ dostawy:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {mockOrder.deliveryType === 'TO_SITE' ? 'Dostawa na plac' : 
                         mockOrder.deliveryType === 'TO_WAREHOUSE' ? 'Dostawa do magazynu' : 'Odbiór własny'}
                      </dd>
                    </div>
                    {mockOrder.budgetCode && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Kod budżetowy:</dt>
                        <dd className="text-sm font-medium text-gray-900">{mockOrder.budgetCode}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Notes */}
                {mockOrder.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Uwagi do zamówienia</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {mockOrder.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Project and People */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Projekt i osoby</h3>
                  <div className="space-y-4">
                    {mockOrder.project && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">🏗️ Projekt</h4>
                        <div className="text-sm text-gray-600">
                          <div className="font-medium">{mockOrder.project.name}</div>
                          <div>{mockOrder.project.address}</div>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">👤 Zamawiający</h4>
                      <div className="text-sm text-gray-600">
                        <div className="font-medium">{mockOrder.orderedBy?.name}</div>
                        <div>{mockOrder.orderedBy?.email}</div>
                      </div>
                    </div>

                    {mockOrder.approvedBy && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">✅ Zatwierdził</h4>
                        <div className="text-sm text-gray-600">
                          <div className="font-medium">{mockOrder.approvedBy.name}</div>
                          <div>{mockOrder.approvedBy.email}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Information */}
                {(mockOrder.deliveryAddress || mockOrder.requestedDeliveryDate) && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">🚚 Informacje o dostawie</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {mockOrder.deliveryAddress && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Adres: </span>
                          {mockOrder.deliveryAddress}
                        </div>
                      )}
                      {mockOrder.requestedDeliveryDate && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Preferowana data: </span>
                          {mockOrder.requestedDeliveryDate.toLocaleDateString('pl-PL')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Pozycje w zamówieniu</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dostawa
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockOrder.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.material?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.material?.description}
                            </div>
                            {item.notes && (
                              <div className="text-xs text-gray-400 mt-1">
                                Uwagi: {item.notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>Zamówiono: {item.requestedQuantity} {item.material?.unit}</div>
                            {item.approvedQuantity !== item.requestedQuantity && (
                              <div className="text-blue-600">
                                Zatwierdzono: {item.approvedQuantity} {item.material?.unit}
                              </div>
                            )}
                            {item.deliveredQuantity > 0 && (
                              <div className="text-green-600">
                                Dostarczono: {item.deliveredQuantity} {item.material?.unit}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.unitPrice.toFixed(2)} {mockOrder.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.totalPrice.toFixed(2)} {mockOrder.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={cn(getItemStatusColor(item.status))}>
                            {getItemStatusLabel(item.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.actualDeliveryDate ? (
                            <div className="text-green-600">
                              ✅ {item.actualDeliveryDate.toLocaleDateString('pl-PL')}
                            </div>
                          ) : item.estimatedDeliveryDate ? (
                            <div className="text-orange-600">
                              📅 {item.estimatedDeliveryDate.toLocaleDateString('pl-PL')}
                            </div>
                          ) : (
                            <div className="text-gray-400">Nie określono</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Łączna wartość zamówienia:</span>
                  <span>{mockOrder.totalAmount?.toFixed(2)} {mockOrder.currency}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Historia zmian statusu</h3>
              
              <div className="flow-root">
                <ul className="-mb-8">
                  {mockOrder.statusHistory?.map((entry, entryIdx) => (
                    <li key={entry.id}>
                      <div className="relative pb-8">
                        {entryIdx !== mockOrder.statusHistory!.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                              <span className="text-white text-sm">
                                {ORDER_STATUS_ICONS[entry.toStatus]}
                              </span>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">{entry.changedBy?.name}</span>{' '}
                                zmienił status na{' '}
                                <Badge className={cn(ORDER_STATUS_COLORS[entry.toStatus], 'mx-1')}>
                                  {ORDER_STATUS_LABELS[entry.toStatus]}
                                </Badge>
                              </p>
                              <p className="text-sm text-gray-500 mt-1">{entry.reason}</p>
                              {entry.notes && (
                                <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded p-2">
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime={entry.changedAt.toISOString()}>
                                {entry.changedAt.toLocaleDateString('pl-PL')}<br/>
                                {entry.changedAt.toLocaleTimeString('pl-PL', { 
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
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Dokumenty</h3>
                <Button variant="outline">
                  📎 Dodaj dokument
                </Button>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <div className="text-4xl mb-4">📄</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Brak dokumentów</h4>
                <p className="text-gray-600 mb-4">
                  Nie dodano jeszcze żadnych dokumentów do tego zamówienia.
                </p>
                <Button variant="outline">
                  Dodaj pierwszy dokument
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}