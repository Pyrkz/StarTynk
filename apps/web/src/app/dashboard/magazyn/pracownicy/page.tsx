'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { UserEquipmentSummary } from '@/features/equipment/types/equipment.types';

interface EmployeeEquipmentData {
  employees: UserEquipmentSummary[];
  stats: {
    totalEmployees: number;
    employeesWithEquipment: number;
    totalAssignedEquipment: number;
    overdueEquipment: number;
  };
}

// Employee Card Component
function EmployeeCard({ employee, onViewDetails }: {
  employee: UserEquipmentSummary;
  onViewDetails: (employee: UserEquipmentSummary) => void;
}) {
  const hasOverdueEquipment = employee.overdueCount > 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-medium text-lg">
              {employee.userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{employee.userName}</h3>
            <p className="text-sm text-gray-600">{employee.userEmail}</p>
            {employee.position && (
              <p className="text-xs text-gray-500">{employee.position}</p>
            )}
          </div>
        </div>
        
        {hasOverdueEquipment && (
          <Badge variant="error">
            {employee.overdueCount} przeterminowane
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {employee.totalAssigned}
          </div>
          <div className="text-xs text-gray-500">Assigned</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">
            {employee.overdueCount}
          </div>
          <div className="text-xs text-gray-500">Overdue</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {employee.recentReturns}
          </div>
          <div className="text-xs text-gray-500">Recent Returns</div>
        </div>
      </div>

      {/* Recent Equipment */}
      {employee.assignedEquipment.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Ostatnio przypisany sprzęt:
          </h4>
          <div className="space-y-1">
            {employee.assignedEquipment.slice(0, 3).map(equipment => (
              <div key={equipment.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-900">{equipment.name}</span>
                <span className={`text-xs ${equipment.isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                  {equipment.isOverdue ? 'Przeterminowany' : equipment.category}
                </span>
              </div>
            ))}
            {employee.assignedEquipment.length > 3 && (
              <div className="text-xs text-gray-500">
                +{employee.assignedEquipment.length - 3} więcej...
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <Button
          onClick={() => onViewDetails(employee)}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Szczegóły
        </Button>
        {employee.totalAssigned > 0 && (
          <Button
            size="sm"
            className="flex-1"
          >
            Zwróć sprzęt
          </Button>
        )}
      </div>
    </div>
  );
}

// Employee Details Modal
function EmployeeDetailsModal({ 
  employee, 
  isOpen, 
  onClose 
}: {
  employee: UserEquipmentSummary | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sprzęt - ${employee.userName}`}
    >
      <div className="p-6 max-h-96 overflow-y-auto">
        {/* Employee Info */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-xl">
                {employee.userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{employee.userName}</h3>
              <p className="text-gray-600">{employee.userEmail}</p>
              {employee.position && (
                <p className="text-sm text-gray-500">{employee.position}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-900">
                {employee.totalAssigned}
              </div>
              <div className="text-sm text-gray-500">Łącznie przypisane</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-red-600">
                {employee.overdueCount}
              </div>
              <div className="text-sm text-gray-500">Przeterminowane</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-green-600">
                {employee.recentReturns}
              </div>
              <div className="text-sm text-gray-500">Ostatnie zwroty</div>
            </div>
          </div>
        </div>

        {/* Equipment List */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Przypisany sprzęt</h4>
          {employee.assignedEquipment.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Brak przypisanego sprzętu
            </p>
          ) : (
            <div className="space-y-3">
              {employee.assignedEquipment.map(equipment => (
                <div 
                  key={equipment.id}
                  className={`p-3 rounded-lg border ${
                    equipment.isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{equipment.name}</h5>
                      <p className="text-sm text-gray-600">{equipment.category}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        Wydano: {new Date(equipment.assignedDate).toLocaleDateString('pl-PL')}
                      </div>
                      {equipment.expectedReturnDate && (
                        <div className="text-xs text-gray-500">
                          Planowany zwrot: {new Date(equipment.expectedReturnDate).toLocaleDateString('pl-PL')}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {equipment.isOverdue && (
                        <Badge variant="error" className="mb-2">
                          Przeterminowany
                        </Badge>
                      )}
                      <div className="text-xs text-gray-500 capitalize">
                        Stan: {equipment.condition}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-2">
          <Button onClick={onClose} variant="outline">
            Zamknij
          </Button>
          {employee.totalAssigned > 0 && (
            <Button>
              Zwróć wszystko
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Stats Overview Component
function StatsOverview({ stats }: { stats: EmployeeEquipmentData['stats'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md text-white text-xl">
                👥
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Łącznie pracowników
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalEmployees}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md text-white text-xl">
                🔧
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Ze sprzętem
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.employeesWithEquipment}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center p-3 bg-yellow-500 rounded-md text-white text-xl">
                📦
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Wydany sprzęt
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalAssignedEquipment}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center p-3 bg-red-500 rounded-md text-white text-xl">
                ⚠️
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Przeterminowane
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.overdueEquipment}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function EmployeeEquipmentRegistry() {
  const router = useRouter();
  const [data, setData] = useState<EmployeeEquipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<UserEquipmentSummary | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'with_equipment' | 'overdue'>('all');

  useEffect(() => {
    const fetchEmployeeEquipment = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/equipment/employees');
        if (!response.ok) {
          throw new Error('Failed to fetch employee equipment data');
        }

        const employeeData: EmployeeEquipmentData = await response.json();
        setData(employeeData);
      } catch (err) {
        console.error('Error fetching employee equipment:', err);
        setError('Błąd podczas ładowania danych');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeEquipment();
  }, []);

  const handleViewDetails = (employee: UserEquipmentSummary) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  const filteredEmployees = data?.employees.filter(employee => {
    const matchesSearch = employee.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' || 
      (filterType === 'with_equipment' && employee.totalAssigned > 0) ||
      (filterType === 'overdue' && employee.overdueCount > 0);

    return matchesSearch && matchesFilter;
  }) || [];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Ładowanie...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rejestr sprzętu pracowników</h1>
          <p className="mt-2 text-gray-600">
            Przegląd sprzętu przypisanego do pracowników
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => router.push('/dashboard/magazyn/wydaj')}
          >
            Wydaj sprzęt
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview stats={data.stats} />

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              type="text"
              placeholder="Szukaj pracownika..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Wszyscy pracownicy</option>
              <option value="with_equipment">Ze sprzętem</option>
              <option value="overdue">Z przeterminowanym sprzętem</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
              variant="outline"
              className="w-full"
            >
              Wyczyść filtry
            </Button>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Brak pracowników
          </h3>
          <p className="text-gray-500 mb-4">
            Nie znaleziono pracowników spełniających kryteria wyszukiwania.
          </p>
          <Button 
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
            }}
            variant="outline"
          >
            Wyczyść filtry
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-700">
              Znaleziono {filteredEmployees.length} pracowników
              {searchTerm && ` dla "${searchTerm}"`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map(employee => (
              <EmployeeCard
                key={employee.userId}
                employee={employee}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </>
      )}

      {/* Employee Details Modal */}
      <EmployeeDetailsModal
        employee={selectedEmployee}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
}