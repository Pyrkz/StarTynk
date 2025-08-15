'use client';

import { useState } from 'react';
import { 
  Smartphone,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface MobileRequestsSubTabProps {
  projectId: string;
}

interface MobileOrderItem {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  estimatedPrice?: number;
}

interface MobileOrder {
  id: string;
  employeeName: string;
  employeeRole: string;
  employeePhoto?: string;
  submissionTime: string;
  location: string;
  items: MobileOrderItem[];
  estimatedValue?: number;
  justification: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  approvalRequired: boolean;
}

const MobileRequestsSubTab = ({ projectId }: MobileRequestsSubTabProps) => {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | MobileOrder['status']>('pending');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Mock data - replace with API call
  const mobileOrders: MobileOrder[] = [
    {
      id: '1',
      employeeName: 'Jan Kowalski',
      employeeRole: 'Tynkarz maszynowy',
      employeePhoto: '/api/placeholder/40/40',
      submissionTime: '2 godziny temu',
      location: 'Budynek B, Piętro 3, Mieszkanie 3A',
      items: [
        { id: '1', materialName: 'Gips szpachlowy Knauf MP75', quantity: 15, unit: 'worków', estimatedPrice: 450 },
        { id: '2', materialName: 'Siatka zbrojąca do tynków', quantity: 50, unit: 'metrów', estimatedPrice: 200 },
        { id: '3', materialName: 'Narożniki aluminiowe', quantity: 20, unit: 'sztuk', estimatedPrice: 180 }
      ],
      estimatedValue: 830,
      justification: 'Potrzebne do dokończenia tynków gipsowych w mieszkaniach 301-305. Brak materiałów wstrzymuje prace tynkarskie.',
      priority: 'high',
      status: 'pending',
      approvalRequired: true
    },
    {
      id: '2',
      employeeName: 'Anna Nowak',
      employeeRole: 'Tynkarz cementowo-wapienny',
      employeePhoto: '/api/placeholder/40/40',
      submissionTime: '4 godziny temu',
      location: 'Budynek A, Parter, Elewacja północna',
      items: [
        { id: '4', materialName: 'Cement portlandzki CEM I 42,5R', quantity: 8, unit: 'worków', estimatedPrice: 240 },
        { id: '5', materialName: 'Wapno hydratyzowane', quantity: 6, unit: 'worków', estimatedPrice: 90 },
        { id: '6', materialName: 'Piasek kwarcowy 0-2mm', quantity: 2, unit: 'tony', estimatedPrice: 300 }
      ],
      estimatedValue: 630,
      justification: 'Wymiana uszkodzonego tynku cementowo-wapiennego na elewacji. Konieczne uzupełnienie zapasów.',
      priority: 'medium',
      status: 'pending',
      approvalRequired: true
    },
    {
      id: '3',
      employeeName: 'Piotr Wiśniewski',
      employeeRole: 'Tynkarz wielofunkcyjny',
      employeePhoto: '/api/placeholder/40/40',
      submissionTime: '5 godzin temu',
      location: 'Budynek C, Piętro 2, Klatka schodowa',
      items: [
        { id: '7', materialName: 'Tynk dekoracyjny strukturalny', quantity: 25, unit: 'kg', estimatedPrice: 400 },
        { id: '8', materialName: 'Grunt głęboko penetrujący', quantity: 10, unit: 'litrów', estimatedPrice: 150 },
        { id: '9', materialName: 'Profile wykończeniowe', quantity: 15, unit: 'sztuk', estimatedPrice: 180 }
      ],
      estimatedValue: 730,
      justification: 'Kontynuacja prac przy tynkach dekoracyjnych w klatce schodowej. Materiały na wykończenie 2 piętra.',
      priority: 'medium',
      status: 'approved',
      approvalRequired: false
    },
    {
      id: '4',
      employeeName: 'Maria Kaczmarek',
      employeeRole: 'Tynkarz gipsowy',
      employeePhoto: '/api/placeholder/40/40',
      submissionTime: 'wczoraj',
      location: 'Budynek A, Piętro 1, Mieszkania 101-103',
      items: [
        { id: '10', materialName: 'Gips szpachlowy do wykończeń', quantity: 12, unit: 'worków', estimatedPrice: 360 },
        { id: '11', materialName: 'Taśma do spoin', quantity: 100, unit: 'metrów', estimatedPrice: 80 }
      ],
      estimatedValue: 440,
      justification: 'Brakujące materiały do wykończenia gipsowego w mieszkaniach 101-103. Zapasy wyczerpane.',
      priority: 'low',
      status: 'rejected',
      approvalRequired: true
    },
    {
      id: '5',
      employeeName: 'Tomasz Lewandowski',
      employeeRole: 'Pomocnik tynkarza',
      employeePhoto: '/api/placeholder/40/40',
      submissionTime: '6 godzin temu',
      location: 'Budynek B, Piętro 1, Pomieszczenia techniczne',
      items: [
        { id: '12', materialName: 'Woda techniczna do mieszanki', quantity: 500, unit: 'litrów', estimatedPrice: 50 },
        { id: '13', materialName: 'Worki na gruz tynkarski', quantity: 50, unit: 'sztuk', estimatedPrice: 100 },
        { id: '14', materialName: 'Środek czyszczący do narzędzi', quantity: 5, unit: 'litrów', estimatedPrice: 75 }
      ],
      estimatedValue: 225,
      justification: 'Materiały pomocnicze do przygotowania podłoża i utrzymania czystości na budowie.',
      priority: 'low',
      status: 'processing',
      approvalRequired: false
    }
  ];

  const statusFilters = [
    { value: 'all', label: 'Wszystkie', count: mobileOrders.length },
    { value: 'pending', label: 'Oczekujące', count: mobileOrders.filter(o => o.status === 'pending').length },
    { value: 'approved', label: 'Zatwierdzone', count: mobileOrders.filter(o => o.status === 'approved').length },
    { value: 'rejected', label: 'Odrzucone', count: mobileOrders.filter(o => o.status === 'rejected').length },
    { value: 'processing', label: 'W realizacji', count: mobileOrders.filter(o => o.status === 'processing').length }
  ];

  const getPriorityBadge = (priority: MobileOrder['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="error">Wysoki</Badge>;
      case 'medium':
        return <Badge variant="warning">Średni</Badge>;
      case 'low':
        return <Badge variant="neutral">Niski</Badge>;
    }
  };

  const getStatusBadge = (status: MobileOrder['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Oczekuje
        </Badge>;
      case 'approved':
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Zatwierdzone
        </Badge>;
      case 'rejected':
        return <Badge variant="error" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Odrzucone
        </Badge>;
      case 'processing':
        return <Badge variant="primary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          W realizacji
        </Badge>;
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllPending = () => {
    const pendingOrderIds = mobileOrders
      .filter(order => order.status === 'pending')
      .map(order => order.id);
    setSelectedOrders(pendingOrderIds);
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedOrders([]);
    setShowBulkActions(false);
  };

  const handleBulkApprove = () => {
    // Handle bulk approval
    console.log('Bulk approve:', selectedOrders);
    clearSelection();
  };

  const handleBulkReject = () => {
    // Handle bulk rejection
    console.log('Bulk reject:', selectedOrders);
    clearSelection();
  };

  const filteredOrders = filterStatus === 'all' 
    ? mobileOrders 
    : mobileOrders.filter(order => order.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header with Bulk Actions */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value as any)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all",
                filterStatus === filter.value
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {filteredOrders.some(o => o.status === 'pending') && (
          <div className="flex gap-2">
            {!showBulkActions ? (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllPending}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Zaznacz oczekujące
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={selectedOrders.length === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Zatwierdź ({selectedOrders.length})
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkReject}
                  disabled={selectedOrders.length === 0}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Odrzuć ({selectedOrders.length})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  Anuluj
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredOrders.map((order) => {
          const isSelected = selectedOrders.includes(order.id);
          
          return (
            <div
              key={order.id}
              className={cn(
                "bg-white rounded-lg border transition-all",
                isSelected 
                  ? "border-blue-500 shadow-elevation-low" 
                  : "border-gray-200 hover:shadow-elevation-low"
              )}
            >
              {/* Order Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {showBulkActions && order.status === 'pending' && (
                      <button
                        onClick={() => toggleOrderSelection(order.id)}
                        className="mt-1"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    )}
                    <img
                      src={order.employeePhoto}
                      alt={order.employeeName}
                      className="w-10 h-10 rounded-full bg-gray-200"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{order.employeeName}</h4>
                      <p className="text-sm text-gray-600">{order.employeeRole}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {order.submissionTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {order.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(order.status)}
                    {getPriorityBadge(order.priority)}
                  </div>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-4 space-y-3">
                {/* Items Summary */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Zamówione materiały ({order.items.length})
                    </span>
                    {order.estimatedValue && (
                      <span className="text-sm font-semibold text-gray-900">
                        ~{order.estimatedValue} zł
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {order.items.slice(0, 2).map((item) => (
                      <p key={item.id} className="text-sm text-gray-600">
                        • {item.materialName} - {item.quantity} {item.unit}
                      </p>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-sm text-gray-500 italic">
                        +{order.items.length - 2} więcej pozycji...
                      </p>
                    )}
                  </div>
                </div>

                {/* Justification */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Uzasadnienie:</p>
                  <p className="text-sm text-gray-600">{order.justification}</p>
                </div>

                {/* Action Buttons */}
                {order.status === 'pending' && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {}}
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Więcej
                    </Button>
                  </div>
                )}

                {order.status === 'approved' && (
                  <div className="flex items-center gap-2 pt-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Zamówienie zatwierdzone - materiały tynkarskie w dostawie
                  </div>
                )}

                {order.status === 'rejected' && (
                  <div className="flex items-center gap-2 pt-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    Zamówienie odrzucone - materiały dostępne w magazynie tynków
                  </div>
                )}

                {order.status === 'processing' && (
                  <div className="flex items-center gap-2 pt-2 text-sm text-blue-600">
                    <Clock className="h-4 w-4" />
                    W realizacji - dostawa materiałów planowana
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Brak zamówień mobilnych w wybranym statusie</p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Informacja o zamówieniach materiałów tynkarskich</p>
            <p>Tynkarze mogą składać zamówienia materiałów bezpośrednio z aplikacji mobilnej podczas pracy na budowie. Zamówienia powyżej 500 zł wymagają zatwierdzenia przez kierownika robót.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileRequestsSubTab;