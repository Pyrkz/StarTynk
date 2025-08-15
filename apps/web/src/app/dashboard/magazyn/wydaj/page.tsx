'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { 
  EquipmentWithRelations,
  EquipmentAssignmentData,
  EQUIPMENT_STATUS_LABELS
} from '@/features/equipment/types/equipment.types';

interface User {
  id: string;
  name: string;
  email: string;
  position?: string;
}

interface IssueFormData {
  equipmentIds: string[];
  userId: string;
  notes?: string;
  expectedReturnDate?: string;
  issueType: 'manual' | 'project' | 'bulk';
  projectId?: string;
}

// Equipment Selection Component
function EquipmentSelector({ 
  availableEquipment, 
  selectedEquipment, 
  onSelectionChange 
}: {
  availableEquipment: EquipmentWithRelations[];
  selectedEquipment: string[];
  onSelectionChange: (equipmentIds: string[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filteredEquipment = availableEquipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(availableEquipment.map(item => ({
    id: item.categoryId,
    name: item.category.name
  })))];

  const toggleSelection = (equipmentId: string) => {
    if (selectedEquipment.includes(equipmentId)) {
      onSelectionChange(selectedEquipment.filter(id => id !== equipmentId));
    } else {
      onSelectionChange([...selectedEquipment, equipmentId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(filteredEquipment.map(item => item.id));
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Szukaj sprzętu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Wszystkie kategorie</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Wybrano: {selectedEquipment.length} / {filteredEquipment.length}
        </div>
        <div className="space-x-2">
          <Button
            onClick={selectAll}
            variant="outline"
            size="sm"
            disabled={filteredEquipment.length === 0}
          >
            Zaznacz wszystkie
          </Button>
          <Button
            onClick={clearSelection}
            variant="outline"
            size="sm"
            disabled={selectedEquipment.length === 0}
          >
            Wyczyść
          </Button>
        </div>
      </div>

      {/* Equipment List */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
        {filteredEquipment.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Brak dostępnego sprzętu spełniającego kryteria
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredEquipment.map(item => (
              <div 
                key={item.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedEquipment.includes(item.id) ? 'bg-blue-50' : ''
                }`}
                onClick={() => toggleSelection(item.id)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedEquipment.includes(item.id)}
                    onChange={() => toggleSelection(item.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.category.name}</p>
                        {item.serialNumber && (
                          <p className="text-xs text-gray-400">S/N: {item.serialNumber}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="success">
                          {EQUIPMENT_STATUS_LABELS[item.status]}
                        </Badge>
                        {item.condition && (
                          <p className="text-xs text-gray-500 mt-1 capitalize">
                            {item.condition}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// User Selector Component
function UserSelector({ 
  users, 
  selectedUserId, 
  onUserChange 
}: {
  users: User[];
  selectedUserId: string;
  onUserChange: (userId: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Szukaj pracownika..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Brak pracowników spełniających kryteria
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <div 
                key={user.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer ${
                  selectedUserId === user.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => onUserChange(user.id)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={selectedUserId === user.id}
                    onChange={() => onUserChange(user.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.position && (
                      <p className="text-xs text-gray-400">{user.position}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Issue Summary Component
function IssueSummary({ 
  selectedEquipment, 
  selectedUser, 
  formData 
}: {
  selectedEquipment: EquipmentWithRelations[];
  selectedUser: User | null;
  formData: IssueFormData;
}) {
  if (selectedEquipment.length === 0 || !selectedUser) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-3">Podsumowanie wydania</h3>
      
      <div className="space-y-3">
        <div>
          <dt className="text-sm font-medium text-gray-500">Wydawany sprzęt</dt>
          <dd className="mt-1">
            {selectedEquipment.map(item => (
              <div key={item.id} className="text-sm text-gray-900 flex justify-between">
                <span>{item.name}</span>
                <span className="text-gray-500">{item.category.name}</span>
              </div>
            ))}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Odbierający</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {selectedUser.name} ({selectedUser.email})
            {selectedUser.position && (
              <span className="text-gray-500"> - {selectedUser.position}</span>
            )}
          </dd>
        </div>

        {formData.expectedReturnDate && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Planowany zwrot</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(formData.expectedReturnDate).toLocaleDateString('pl-PL')}
            </dd>
          </div>
        )}

        {formData.notes && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Uwagi</dt>
            <dd className="mt-1 text-sm text-gray-900">{formData.notes}</dd>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Component
export default function EquipmentIssuePage() {
  const router = useRouter();
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentWithRelations[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<IssueFormData>({
    equipmentIds: [],
    userId: '',
    notes: '',
    expectedReturnDate: '',
    issueType: 'manual',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch available equipment
        const equipmentResponse = await fetch('/api/equipment?status=AVAILABLE&limit=1000');
        if (!equipmentResponse.ok) throw new Error('Failed to fetch equipment');
        const equipmentData = await equipmentResponse.json();
        
        // Fetch users
        const usersResponse = await fetch('/api/users?limit=1000');
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        const usersData = await usersResponse.json();
        
        setAvailableEquipment(equipmentData.equipment || []);
        setUsers(usersData.users || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Błąd podczas ładowania danych');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedEquipment = availableEquipment.filter(item => 
    formData.equipmentIds.includes(item.id)
  );
  
  const selectedUser = users.find(user => user.id === formData.userId) || null;

  const handleEquipmentSelection = (equipmentIds: string[]) => {
    setFormData(prev => ({ ...prev, equipmentIds }));
  };

  const handleUserSelection = (userId: string) => {
    setFormData(prev => ({ ...prev, userId }));
  };

  const handleSubmit = async () => {
    if (formData.equipmentIds.length === 0 || !formData.userId) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Submit each equipment assignment
      const assignments = formData.equipmentIds.map(equipmentId => ({
        equipmentId,
        userId: formData.userId,
        notes: formData.notes,
        expectedReturnDate: formData.expectedReturnDate ? new Date(formData.expectedReturnDate) : undefined,
      }));

      for (const assignment of assignments) {
        const response = await fetch('/api/equipment/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignment),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to assign equipment');
        }
      }

      // Success - redirect to success page or equipment list
      router.push('/dashboard/magazyn?success=equipment_issued');
      
    } catch (err) {
      console.error('Error issuing equipment:', err);
      setError(err instanceof Error ? err.message : 'Błąd podczas wydawania sprzętu');
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: return formData.equipmentIds.length > 0;
      case 2: return formData.userId !== '';
      case 3: return true; // Review step
      default: return false;
    }
  };

  const stepTitles = [
    'Wybierz sprzęt',
    'Wybierz odbiorce',
    'Szczegóły i potwierdzenie'
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Ładowanie...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800">Błąd</h3>
          <div className="mt-2 text-sm text-red-700">{error}</div>
          <div className="mt-4">
            <Button
              onClick={() => router.push('/dashboard/magazyn')}
              variant="outline"
              size="sm"
            >
              Wróć do magazynu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Wydaj sprzęt</h1>
        <p className="mt-2 text-gray-600">
          Wydawanie sprzętu pracownikom i projektom
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {stepTitles.map((title, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              
              return (
                <li key={stepNumber} className={`relative ${index !== stepTitles.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    {index !== stepTitles.length - 1 && (
                      <div className={`h-0.5 w-full ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className={`relative w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                    isCompleted ? 'bg-blue-600 border-blue-600' :
                    isCurrent ? 'border-blue-600 bg-white' : 'border-gray-300 bg-white'
                  }`}>
                    {isCompleted ? (
                      <span className="text-white text-sm">✓</span>
                    ) : (
                      <span className={`text-sm ${isCurrent ? 'text-blue-600' : 'text-gray-500'}`}>
                        {stepNumber}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className={`text-sm font-medium ${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {title}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Wybierz sprzęt do wydania
            </h2>
            <EquipmentSelector
              availableEquipment={availableEquipment}
              selectedEquipment={formData.equipmentIds}
              onSelectionChange={handleEquipmentSelection}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Wybierz odbiorce sprzętu
            </h2>
            <UserSelector
              users={users}
              selectedUserId={formData.userId}
              onUserChange={handleUserSelection}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">
              Szczegóły wydania
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planowana data zwrotu (opcjonalnie)
                </label>
                <Input
                  type="date"
                  value={formData.expectedReturnDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedReturnDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uwagi (opcjonalnie)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dodatkowe informacje o wydaniu..."
              />
            </div>

            <IssueSummary
              selectedEquipment={selectedEquipment}
              selectedUser={selectedUser}
              formData={formData}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <Button
              onClick={() => setCurrentStep(prev => prev - 1)}
              variant="outline"
            >
              Wstecz
            </Button>
          )}
        </div>
        
        <div className="space-x-2">
          <Button
            onClick={() => router.push('/dashboard/magazyn')}
            variant="outline"
          >
            Anuluj
          </Button>
          
          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceedToNextStep()}
            >
              Dalej
            </Button>
          ) : (
            <Button
              onClick={() => setShowConfirmModal(true)}
              disabled={!canProceedToNextStep() || isSubmitting}
            >
              {isSubmitting ? 'Wydawanie...' : 'Wydaj sprzęt'}
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Potwierdź wydanie sprzętu"
        >
          <div className="p-4">
            <p className="text-gray-600 mb-4">
              Czy na pewno chcesz wydać {selectedEquipment.length} pozycji sprzętu 
              użytkownikowi {selectedUser?.name}?
            </p>
            
            <IssueSummary
              selectedEquipment={selectedEquipment}
              selectedUser={selectedUser}
              formData={formData}
            />
            
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                onClick={() => setShowConfirmModal(false)}
                variant="outline"
                disabled={isSubmitting}
              >
                Anuluj
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Wydawanie...' : 'Potwierdź wydanie'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}