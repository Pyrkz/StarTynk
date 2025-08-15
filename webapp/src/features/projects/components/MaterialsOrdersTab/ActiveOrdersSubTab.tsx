'use client';

import { useState } from 'react';
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Package,
  ChevronRight,
  Eye,
  Edit,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ActiveOrdersSubTabProps {
  projectId: string;
}

interface OrderItem {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  submissionDate: string;
  submissionTime: string;
  requestedBy: string;
  requestedByRole: string;
  priority: 'standard' | 'urgent' | 'critical';
  status: 'new' | 'processing' | 'inTransit' | 'delivered';
  items: OrderItem[];
  totalValue: number;
  supplier: string;
  expectedDelivery?: string;
  trackingNumber?: string;
  currentStage: string;
}

const ActiveOrdersSubTab = ({ projectId }: ActiveOrdersSubTabProps) => {
  const [selectedStatus, setSelectedStatus] = useState<'all' | Order['status']>('all');
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);

  // Mock data - replace with API call
  const orders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-0156',
      submissionDate: '16.04.2024',
      submissionTime: '09:30',
      requestedBy: 'Jan Kowalski',
      requestedByRole: 'Kierownik budowy',
      priority: 'urgent',
      status: 'new',
      items: [
        { id: '1', materialName: 'Cement portlandzki CEM I 42,5R', quantity: 50, unit: 'worków', unitPrice: 25 },
        { id: '2', materialName: 'Piasek budowlany', quantity: 10, unit: 'ton', unitPrice: 80 }
      ],
      totalValue: 2050,
      supplier: 'BuildSupply Co.',
      expectedDelivery: '20.04.2024',
      currentStage: 'Oczekuje na przetworzenie'
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-0155',
      submissionDate: '15.04.2024',
      submissionTime: '14:15',
      requestedBy: 'Anna Nowak',
      requestedByRole: 'Brygadzista',
      priority: 'standard',
      status: 'processing',
      items: [
        { id: '3', materialName: 'Płytki ceramiczne 60x60', quantity: 200, unit: 'm²', unitPrice: 45 },
        { id: '4', materialName: 'Klej do płytek', quantity: 20, unit: 'worków', unitPrice: 30 },
        { id: '5', materialName: 'Fuga elastyczna', quantity: 10, unit: 'kg', unitPrice: 15 }
      ],
      totalValue: 9750,
      supplier: 'CeramicWorld',
      expectedDelivery: '22.04.2024',
      currentStage: 'W trakcie kompletowania'
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-0154',
      submissionDate: '14.04.2024',
      submissionTime: '11:00',
      requestedBy: 'Piotr Wiśniewski',
      requestedByRole: 'Elektryk',
      priority: 'critical',
      status: 'inTransit',
      items: [
        { id: '6', materialName: 'Kabel YDY 3x2.5mm²', quantity: 500, unit: 'metrów', unitPrice: 8 }
      ],
      totalValue: 4000,
      supplier: 'ElectroSupply',
      expectedDelivery: '17.04.2024',
      trackingNumber: 'PL123456789',
      currentStage: 'W transporcie'
    },
    {
      id: '4',
      orderNumber: 'ORD-2024-0153',
      submissionDate: '13.04.2024',
      submissionTime: '16:45',
      requestedBy: 'Marek Zieliński',
      requestedByRole: 'Hydraulik',
      priority: 'standard',
      status: 'delivered',
      items: [
        { id: '7', materialName: 'Rura PVC 110mm', quantity: 50, unit: 'sztuk', unitPrice: 25 },
        { id: '8', materialName: 'Kolanka PVC 110mm', quantity: 30, unit: 'sztuk', unitPrice: 8 }
      ],
      totalValue: 1490,
      supplier: 'PlumbingPro',
      expectedDelivery: '16.04.2024',
      currentStage: 'Dostarczone'
    }
  ];

  const statusFilters = [
    { value: 'all', label: 'Wszystkie', count: orders.length, color: 'bg-gray-100 text-gray-700' },
    { value: 'new', label: 'Nowe', count: orders.filter(o => o.status === 'new').length, color: 'bg-red-100 text-red-700' },
    { value: 'processing', label: 'W realizacji', count: orders.filter(o => o.status === 'processing').length, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'inTransit', label: 'W transporcie', count: orders.filter(o => o.status === 'inTransit').length, color: 'bg-orange-100 text-orange-700' },
    { value: 'delivered', label: 'Dostarczone', count: orders.filter(o => o.status === 'delivered').length, color: 'bg-green-100 text-green-700' }
  ];

  const getPriorityBadge = (priority: Order['priority']) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="error">Krytyczne</Badge>;
      case 'urgent':
        return <Badge variant="warning">Pilne</Badge>;
      default:
        return <Badge variant="neutral">Standardowe</Badge>;
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'inTransit':
        return <Truck className="h-5 w-5 text-orange-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getProgressPercentage = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return 10;
      case 'processing':
        return 40;
      case 'inTransit':
        return 75;
      case 'delivered':
        return 100;
      default:
        return 0;
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  return (
    <div className="space-y-6">
      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedStatus(filter.value as any)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              selectedStatus === filter.value
                ? filter.color
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <span>{filter.label}</span>
            <span className="text-sm font-normal">({filter.count})</span>
          </button>
        ))}
      </div>

      {/* Orders Timeline */}
      <div className="space-y-4">
        {filteredOrders.map((order, index) => {
          const isExpanded = expandedOrders.includes(order.id);
          const progress = getProgressPercentage(order.status);

          return (
            <div
              key={order.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-elevation-low transition-all"
            >
              {/* Order Header */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => toggleOrderExpansion(order.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {getStatusIcon(order.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-gray-900">{order.orderNumber}</h4>
                        {getPriorityBadge(order.priority)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Złożone: {order.submissionDate}, {order.submissionTime}
                      </p>
                      <p className="text-sm text-gray-600">
                        Przez: <span className="font-medium">{order.requestedBy}</span> - {order.requestedByRole}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{order.totalValue.toFixed(2)} zł</p>
                    <p className="text-sm text-gray-600">{order.items.length} pozycji</p>
                    <ChevronRight className={cn(
                      "h-5 w-5 text-gray-400 mt-2 transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{order.currentStage}</span>
                    {order.expectedDelivery && (
                      <span className="text-gray-600">
                        Przewidywana dostawa: <span className="font-medium">{order.expectedDelivery}</span>
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        order.status === 'new' && "bg-red-500",
                        order.status === 'processing' && "bg-yellow-500",
                        order.status === 'inTransit' && "bg-orange-500",
                        order.status === 'delivered' && "bg-green-500"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Items */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Zamówione pozycje</h5>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{item.materialName}</p>
                              <p className="text-sm text-gray-600">
                                {item.quantity} {item.unit} × {item.unitPrice.toFixed(2)} zł
                              </p>
                            </div>
                            <p className="font-medium">{(item.quantity * item.unitPrice).toFixed(2)} zł</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Informacje o dostawcy</h5>
                        <div className="bg-white rounded-lg p-3 space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Firma:</span> {order.supplier}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Kontakt:</span> +48 123 456 789
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Email:</span> zamowienia@supplier.pl
                          </p>
                          {order.trackingNumber && (
                            <p className="text-sm">
                              <span className="font-medium">Nr śledzenia:</span>{' '}
                              <a href="#" className="text-blue-600 hover:underline">{order.trackingNumber}</a>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          Szczegóły
                        </Button>
                        {order.status === 'new' && (
                          <>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Edit className="h-4 w-4 mr-1" />
                              Edytuj
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700">
                              <X className="h-4 w-4 mr-1" />
                              Anuluj
                            </Button>
                          </>
                        )}
                        {order.status === 'inTransit' && order.trackingNumber && (
                          <Button variant="primary" size="sm" className="flex-1">
                            <Truck className="h-4 w-4 mr-1" />
                            Śledź przesyłkę
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Brak zamówień w wybranym statusie</p>
        </div>
      )}
    </div>
  );
};

export default ActiveOrdersSubTab;