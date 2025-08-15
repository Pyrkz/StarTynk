'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { MaterialOrder, OrderStatus, OrderPriority } from '@/types/materials';
import { 
  ORDER_STATUS_COLORS, 
  ORDER_STATUS_LABELS, 
  ORDER_STATUS_ICONS,
  ORDER_PRIORITY_COLORS,
  ORDER_PRIORITY_LABELS 
} from '@/types/materials';

interface OrdersDashboardProps {
  orders?: MaterialOrder[];
  isLoading?: boolean;
}

type FilterStatus = OrderStatus | 'ALL';
type SortOption = 'newest' | 'oldest' | 'priority' | 'amount';

export const OrdersDashboard: React.FC<OrdersDashboardProps> = ({
  orders = [],
  isLoading = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for development - replace with real data later
  const mockOrders: MaterialOrder[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      projectId: 'proj-1',
      orderedById: 'user-1',
      status: 'NEW',
      priority: 'HIGH',
      deliveryType: 'TO_SITE',
      totalAmount: 15420.50,
      currency: 'PLN',
      orderDate: new Date('2024-01-15'),
      neededDate: new Date('2024-01-20'),
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      notes: 'Pilne zamówienie materiałów do wykończenia',
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
      items: [
        {
          id: 'item-1',
          orderId: '1',
          materialId: 'mat-1',
          requestedQuantity: 100,
          deliveredQuantity: 0,
          unitPrice: 12.50,
          totalPrice: 1250.00,
          status: 'PENDING',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      projectId: 'proj-2',
      orderedById: 'user-2',
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      deliveryType: 'TO_WAREHOUSE',
      totalAmount: 8750.00,
      currency: 'PLN',
      orderDate: new Date('2024-01-14'),
      neededDate: new Date('2024-01-18'),
      isActive: true,
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-15'),
      project: {
        id: 'proj-2',
        name: 'Biurowiec City Center',
        address: 'ul. Centralna 25, Kraków'
      },
      orderedBy: {
        id: 'user-2',
        name: 'Anna Nowak',
        email: 'anna.nowak@example.com'
      }
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      projectId: 'proj-1',
      orderedById: 'user-1',
      status: 'COMPLETED',
      priority: 'LOW',
      deliveryType: 'TO_SITE',
      totalAmount: 3280.00,
      currency: 'PLN',
      orderDate: new Date('2024-01-10'),
      neededDate: new Date('2024-01-15'),
      completedAt: new Date('2024-01-14'),
      isActive: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-14'),
      project: {
        id: 'proj-1',
        name: 'Osiedle Słoneczne - Budynek A',
        address: 'ul. Słoneczna 15, Warszawa'
      },
      orderedBy: {
        id: 'user-1',
        name: 'Jan Kowalski',
        email: 'jan.kowalski@example.com'
      }
    },
    {
      id: '4',
      orderNumber: 'ORD-2024-004',
      projectId: 'proj-3',
      orderedById: 'user-3',
      status: 'PARTIALLY_DELIVERED',
      priority: 'URGENT',
      deliveryType: 'TO_SITE',
      totalAmount: 22500.00,
      currency: 'PLN',
      orderDate: new Date('2024-01-12'),
      neededDate: new Date('2024-01-16'),
      isActive: true,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-15'),
      project: {
        id: 'proj-3',
        name: 'Hotel Marina',
        address: 'ul. Portowa 8, Gdańsk'
      },
      orderedBy: {
        id: 'user-3',
        name: 'Piotr Wiśniewski',
        email: 'piotr.wisniewski@example.com'
      }
    }
  ];

  const allOrders = orders.length > 0 ? orders : mockOrders;

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = allOrders.filter(order => {
      // Status filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(query) ||
          order.project?.name.toLowerCase().includes(query) ||
          order.orderedBy?.name.toLowerCase().includes(query)
        );
      }
      
      return true;
    });

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        case 'oldest':
          return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        case 'priority':
          const priorityOrder = { CRITICAL: 5, URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'amount':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allOrders, statusFilter, searchQuery, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = allOrders.length;
    const newOrders = allOrders.filter(o => o.status === 'NEW').length;
    const inProgress = allOrders.filter(o => o.status === 'IN_PROGRESS').length;
    const completed = allOrders.filter(o => o.status === 'COMPLETED').length;
    const urgent = allOrders.filter(o => o.priority === 'URGENT' || o.priority === 'CRITICAL').length;
    
    return { total, newOrders, inProgress, completed, urgent };
  }, [allOrders]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zamówienia materiałów i narzędzi</h1>
          <p className="text-gray-600 mt-1">Zarządzaj zamówieniami i monitoruj ich status</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/zamowienia/nowe">
            <span className="mr-2">➕</span>
            Nowe zamówienie
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-elevation-medium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wszystkie zamówienia</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="text-2xl">📦</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-elevation-medium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nowe zamówienia</p>
              <p className="text-2xl font-bold text-red-600">{stats.newOrders}</p>
            </div>
            <div className="text-2xl">🔴</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-elevation-medium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">W realizacji</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
            <div className="text-2xl">🟡</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-elevation-medium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Zrealizowane</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="text-2xl">🟢</div>
          </div>
        </div>
      </div>


      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-elevation-medium p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Szukaj po numerze zamówienia, projekcie lub osobie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ALL">Wszystkie statusy</option>
              <option value="NEW">Nowe</option>
              <option value="PENDING_APPROVAL">Oczekuje zatwierdzenia</option>
              <option value="IN_PROGRESS">W realizacji</option>
              <option value="PARTIALLY_DELIVERED">Częściowo dostarczone</option>
              <option value="COMPLETED">Zrealizowane</option>
              <option value="CANCELLED">Anulowane</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="newest">Najnowsze</option>
              <option value="oldest">Najstarsze</option>
              <option value="priority">Według priorytetu</option>
              <option value="amount">Według wartości</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Brak zamówień</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'ALL' 
                  ? 'Nie znaleziono zamówień spełniających kryteria wyszukiwania.'
                  : 'Nie masz jeszcze żadnych zamówień. Utwórz pierwsze zamówienie.'
                }
              </p>
              {(!searchQuery && statusFilter === 'ALL') && (
                <Button asChild>
                  <Link href="/dashboard/zamowienia/nowe">
                    Utwórz pierwsze zamówienie
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/zamowienia/${order.id}`}
                className="block bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.orderNumber}
                      </h3>
                      <Badge className={cn(ORDER_STATUS_COLORS[order.status])}>
                        {ORDER_STATUS_ICONS[order.status]} {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                      <Badge className={cn(ORDER_PRIORITY_COLORS[order.priority])}>
                        {ORDER_PRIORITY_LABELS[order.priority]}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-4">
                        <span>🏗️ {order.project?.name}</span>
                        <span>👤 {order.orderedBy?.name}</span>
                        <span>📅 {order.orderDate.toLocaleDateString('pl-PL')}</span>
                      </div>
                      {order.notes && (
                        <div className="mt-2">
                          <span className="text-gray-500">Uwagi: </span>
                          <span>{order.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:items-end gap-2">
                    {order.totalAmount && (
                      <div className="text-lg font-semibold text-gray-900">
                        {order.totalAmount.toLocaleString('pl-PL', {
                          style: 'currency',
                          currency: order.currency
                        })}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      {order.neededDate && (
                        <span>Potrzebne: {order.neededDate.toLocaleDateString('pl-PL')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};