'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  DetailedEquipmentItem, 
  AssignmentHistoryEntry, 
  MaintenanceHistoryEntry,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CONDITIONS
} from '@/features/equipment/types/equipment.types';

interface EquipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: DetailedEquipmentItem;
  onUpdate?: (updatedEquipment: DetailedEquipmentItem) => void;
}

type TabType = 'overview' | 'assignments' | 'maintenance' | 'actions';

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [assignmentForm, setAssignmentForm] = useState({
    employeeName: '',
    expectedReturn: '',
    project: '',
    notes: ''
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'ASSIGNED': return 'primary';
      case 'DAMAGED': return 'error';
      case 'RETIRED': return 'neutral';
      default: return 'neutral';
    }
  };

  const getConditionColor = (condition: string) => {
    const conditionObj = EQUIPMENT_CONDITIONS.find(c => c.value === condition);
    return conditionObj?.color || 'gray';
  };

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: '📋' },
    { id: 'assignments', label: 'Historia wydań', icon: '👥' },
    { id: 'maintenance', label: 'Konserwacja', icon: '🔧' },
    { id: 'actions', label: 'Akcje', icon: '⚙️' }
  ];

  const TabNavigation = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Equipment Photo */}
      <div className="flex justify-center">
        <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          {equipment.imageUrl ? (
            <img 
              src={equipment.imageUrl} 
              alt={equipment.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-gray-400 text-6xl">🔧</div>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa sprzętu
            </label>
            <div className="text-lg font-semibold text-gray-900">{equipment.name}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <div className="text-gray-900">{equipment.model || 'Nie określono'}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numer seryjny
            </label>
            <div className="text-gray-900 font-mono">{equipment.serialNumber}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Badge variant={getStatusBadgeVariant(equipment.status)}>
              {EQUIPMENT_STATUS_LABELS[equipment.status]}
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stan techniczny
            </label>
            <div className={`text-${getConditionColor(equipment.condition)}-600 font-medium capitalize`}>
              {EQUIPMENT_CONDITIONS.find(c => c.value === equipment.condition)?.label || equipment.condition}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data zakupu
            </label>
            <div className="text-gray-900">{formatDate(equipment.purchaseDate)}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cena zakupu
            </label>
            <div className="text-gray-900 font-semibold">{formatCurrency(equipment.purchasePrice)}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lokalizacja
            </label>
            <div className="text-gray-900">{equipment.location}</div>
          </div>
        </div>
      </div>

      {/* Current Assignment */}
      {equipment.currentAssignment && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-lg font-medium text-blue-900 mb-3">Aktualne wydanie</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-blue-700">Wydany dla:</div>
              <div className="font-medium text-blue-900">{equipment.currentAssignment.employeeName}</div>
            </div>
            <div>
              <div className="text-sm text-blue-700">Data wydania:</div>
              <div className="font-medium text-blue-900">{formatDate(equipment.currentAssignment.assignedDate)}</div>
            </div>
            {equipment.currentAssignment.expectedReturnDate && (
              <div>
                <div className="text-sm text-blue-700">Oczekiwany zwrot:</div>
                <div className="font-medium text-blue-900">{formatDate(equipment.currentAssignment.expectedReturnDate)}</div>
              </div>
            )}
            {equipment.currentAssignment.project && (
              <div>
                <div className="text-sm text-blue-700">Projekt:</div>
                <div className="font-medium text-blue-900">{equipment.currentAssignment.project}</div>
              </div>
            )}
          </div>
          {equipment.currentAssignment.notes && (
            <div className="mt-3">
              <div className="text-sm text-blue-700">Notatki:</div>
              <div className="text-blue-900">{equipment.currentAssignment.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* Last Activity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ostatnia aktywność
        </label>
        <div className="text-gray-900">{formatDate(equipment.lastActivity)}</div>
      </div>
    </div>
  );

  const AssignmentsTab = () => (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-900">Historia wydań</h4>
      
      {equipment.assignmentHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <div>Brak historii wydań</div>
        </div>
      ) : (
        <div className="space-y-4">
          {equipment.assignmentHistory.map((assignment, index) => (
            <div key={assignment.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-gray-900">
                  {assignment.employeeName}
                </div>
                <div className="text-sm text-gray-500">
                  #{index + 1}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Wydano:</span>
                  <span className="ml-2 font-medium">{formatDate(assignment.assignedDate)}</span>
                </div>
                {assignment.returnDate && (
                  <div>
                    <span className="text-gray-600">Zwrócono:</span>
                    <span className="ml-2 font-medium">{formatDate(assignment.returnDate)}</span>
                  </div>
                )}
                {assignment.duration && (
                  <div>
                    <span className="text-gray-600">Czas użytkowania:</span>
                    <span className="ml-2 font-medium">{assignment.duration} dni</span>
                  </div>
                )}
                {assignment.project && (
                  <div>
                    <span className="text-gray-600">Projekt:</span>
                    <span className="ml-2 font-medium">{assignment.project}</span>
                  </div>
                )}
              </div>
              
              {assignment.notes && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-600">Notatki:</span>
                  <div className="mt-1 text-gray-800">{assignment.notes}</div>
                </div>
              )}
              
              {assignment.returnCondition && (
                <div className="mt-3">
                  <span className="text-sm text-gray-600">Stan przy zwrocie:</span>
                  <Badge size="sm" variant="neutral" className="ml-2">
                    {EQUIPMENT_CONDITIONS.find(c => c.value === assignment.returnCondition)?.label}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const MaintenanceTab = () => (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-900">Historia konserwacji</h4>
      
      {equipment.maintenanceHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔧</div>
          <div>Brak historii konserwacji</div>
        </div>
      ) : (
        <div className="space-y-4">
          {equipment.maintenanceHistory.map((maintenance, index) => (
            <div key={maintenance.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-gray-900">
                  {maintenance.description}
                </div>
                <Badge size="sm" variant="neutral">
                  {maintenance.type === 'inspection' ? 'Przegląd' :
                   maintenance.type === 'repair' ? 'Naprawa' :
                   maintenance.type === 'service' ? 'Serwis' : 'Kalibracja'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Data:</span>
                  <span className="ml-2 font-medium">{formatDate(maintenance.date)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Koszt:</span>
                  <span className="ml-2 font-medium">{formatCurrency(maintenance.cost)}</span>
                </div>
                {maintenance.serviceProvider && (
                  <div>
                    <span className="text-gray-600">Wykonawca:</span>
                    <span className="ml-2 font-medium">{maintenance.serviceProvider}</span>
                  </div>
                )}
                {maintenance.nextDueDate && (
                  <div>
                    <span className="text-gray-600">Następny przegląd:</span>
                    <span className="ml-2 font-medium">{formatDate(maintenance.nextDueDate)}</span>
                  </div>
                )}
              </div>
              
              {maintenance.notes && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-600">Uwagi:</span>
                  <div className="mt-1 text-gray-800">{maintenance.notes}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ActionsTab = () => (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-900">Akcje sprzętu</h4>
      
      {/* Assignment Section */}
      {equipment.status === 'AVAILABLE' && (
        <div className="bg-green-50 rounded-lg p-4">
          <h5 className="text-lg font-medium text-green-900 mb-4">Wydaj sprzęt</h5>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa pracownika
              </label>
              <Input
                type="text"
                value={assignmentForm.employeeName}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, employeeName: e.target.value }))}
                placeholder="Wprowadź imię i nazwisko"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Oczekiwana data zwrotu
              </label>
              <Input
                type="date"
                value={assignmentForm.expectedReturn}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, expectedReturn: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projekt
              </label>
              <Input
                type="text"
                value={assignmentForm.project}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, project: e.target.value }))}
                placeholder="Nazwa projektu (opcjonalnie)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notatki
              </label>
              <textarea
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Dodatkowe informacje"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
            
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Wydaj sprzęt
            </Button>
          </div>
        </div>
      )}

      {/* Return Section */}
      {equipment.status === 'ASSIGNED' && equipment.currentAssignment && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="text-lg font-medium text-blue-900 mb-4">Odbierz sprzęt</h5>
          <div className="mb-4">
            <div className="text-sm text-blue-700">Aktualnie wydany dla:</div>
            <div className="font-medium text-blue-900">{equipment.currentAssignment.employeeName}</div>
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            Odbierz sprzęt
          </Button>
        </div>
      )}

      {/* Status Change Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="text-lg font-medium text-gray-900 mb-4">Zmień status</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {equipment.status !== 'DAMAGED' && (
            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
              Zgłoś uszkodzenie
            </Button>
          )}
          {equipment.status === 'DAMAGED' && (
            <Button variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
              Oznacz jako naprawiony
            </Button>
          )}
          <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50">
            Zaplanuj konserwację
            </Button>
          {equipment.status !== 'RETIRED' && (
            <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50">
              Wycofaj z użytku
            </Button>
          )}
          <Button variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50">
            Zmień lokalizację
          </Button>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h5 className="text-lg font-medium text-yellow-900 mb-4">Dodaj notatkę</h5>
        <div className="space-y-3">
          <textarea
            placeholder="Wprowadź notatkę dotyczącą sprzętu..."
            className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            rows={3}
          />
          <Button variant="outline" className="text-yellow-700 border-yellow-300 hover:bg-yellow-100">
            Zapisz notatkę
          </Button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'assignments':
        return <AssignmentsTab />;
      case 'maintenance':
        return <MaintenanceTab />;
      case 'actions':
        return <ActionsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={equipment.name}
      size="xl"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        <TabNavigation />
        {renderTabContent()}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Zamknij
          </Button>
          <Button>
            Zapisz zmiany
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EquipmentDetailModal;