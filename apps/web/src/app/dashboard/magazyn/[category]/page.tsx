'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EquipmentDetailModal } from '@/features/equipment/components/EquipmentDetailModal';
import { useMockEquipmentData } from '@/features/equipment/hooks/useMockEquipmentData';
import { 
  DetailedEquipmentItem,
  EquipmentViewMode,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CONDITIONS
} from '@/features/equipment/types/equipment.types';

interface CategoryFilters {
  search: string;
  status: string;
  condition: string;
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { categories, loading, getCategoryById } = useMockEquipmentData();
  const [viewMode, setViewMode] = useState<EquipmentViewMode>('grid');
  const [selectedEquipment, setSelectedEquipment] = useState<DetailedEquipmentItem | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedItemForAssignment, setSelectedItemForAssignment] = useState<DetailedEquipmentItem | null>(null);
  const [filters, setFilters] = useState<CategoryFilters>({
    search: '',
    status: '',
    condition: '',
  });

  const categoryId = params.category as string;
  const category = getCategoryById(categoryId);

  // Filter equipment based on filters
  const filteredEquipment = useMemo(() => {
    if (!category) return [];
    
    return category.equipmentList.filter(item => {
      const matchesSearch = !filters.search || 
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.serialNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.model?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || item.status === filters.status;
      const matchesCondition = !filters.condition || item.condition === filters.condition;
      
      return matchesSearch && matchesStatus && matchesCondition;
    });
  }, [category, filters]);

  const handleFiltersChange = (newFilters: Partial<CategoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      condition: '',
    });
  };

  const handleItemClick = (item: DetailedEquipmentItem) => {
    setSelectedEquipment(item);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  // Category Stats Overview
  const CategoryStatsOverview = () => {
    if (!category) return null;
    
    const utilizationRate = category.totalCount > 0 
      ? ((category.assignedCount / category.totalCount) * 100).toFixed(1)
      : '0';

    return (
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Statystyki kategorii</h2>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-gray-900">{category.totalCount}</div>
            <div className="text-sm text-gray-500">pozycji łącznie</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="text-lg font-semibold text-emerald-700">{category.availableCount}</div>
            <div className="text-sm text-emerald-600">Dostępne</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-lg font-semibold text-slate-700">{category.assignedCount}</div>
            <div className="text-sm text-slate-600">Wydane</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="text-lg font-semibold text-amber-700">{category.damagedCount}</div>
            <div className="text-sm text-amber-600">Uszkodzone</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-lg font-semibold text-gray-700">{category.availableCount}/{category.totalCount}</div>
            <div className="text-sm text-gray-600">Dostępność</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Poziom wykorzystania</span>
            <span className="text-sm font-semibold text-gray-900">{utilizationRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                parseFloat(utilizationRate) >= 80 
                  ? 'bg-amber-500' 
                  : parseFloat(utilizationRate) >= 60 
                  ? 'bg-slate-500' 
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(parseFloat(utilizationRate), 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Equipment Grid View
  const EquipmentGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredEquipment.map((item) => (
        <div
          key={item.id}
          onClick={() => handleItemClick(item)}
          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 hover:border-gray-300 group"
        >
          <div className="p-4">
            {/* Equipment Image */}
            <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
              <div className="text-gray-400 text-4xl">🔧</div>
            </div>

            {/* Equipment Info */}
            <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
              {item.name}
            </h3>
            
            {/* Serial Number */}
            <p className="text-xs text-gray-500 mb-2 font-mono">S/N: {item.serialNumber}</p>

            {/* Status and Condition */}
            <div className="flex items-center justify-between mb-3">
              <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
                {EQUIPMENT_STATUS_LABELS[item.status]}
              </Badge>
              <span className={`text-xs capitalize text-${getConditionColor(item.condition)}-600`}>
                {EQUIPMENT_CONDITIONS.find(c => c.value === item.condition)?.label}
              </span>
            </div>

            {/* Assignment Info */}
            {item.currentAssignment && item.status === 'ASSIGNED' && (
              <div className="text-xs text-gray-600 mb-2">
                <div>Wydane: {item.currentAssignment.employeeName}</div>
                <div>Od: {formatDate(item.currentAssignment.assignedDate)}</div>
              </div>
            )}

            {/* Price and Location */}
            <div className="text-xs text-gray-500 space-y-1">
              <div>Wartość: {formatCurrency(item.purchasePrice)}</div>
              <div className="truncate">Lokalizacja: {item.location}</div>
            </div>

            {/* Quick Actions */}
            <div className="mt-3 flex space-x-2">
              {item.status === 'AVAILABLE' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItemForAssignment(item);
                    setShowAssignModal(true);
                  }}
                  className="flex-1 bg-emerald-600 text-white text-xs py-1 px-2 rounded hover:bg-emerald-700 transition-colors"
                >
                  Wydaj
                </button>
              )}
              {item.status === 'ASSIGNED' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle return action
                  }}
                  className="flex-1 bg-slate-600 text-white text-xs py-1 px-2 rounded hover:bg-slate-700 transition-colors"
                >
                  Odbierz
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(item);
                }}
                className="flex-1 bg-gray-600 text-white text-xs py-1 px-2 rounded hover:bg-gray-700 transition-colors"
              >
                Szczegóły
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Equipment List View
  const EquipmentListView = () => (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sprzęt
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Przypisany do
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Wartość
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredEquipment.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      🔧
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500 font-mono">S/N: {item.serialNumber}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
                  {EQUIPMENT_STATUS_LABELS[item.status]}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm capitalize text-${getConditionColor(item.condition)}-600 font-medium`}>
                  {EQUIPMENT_CONDITIONS.find(c => c.value === item.condition)?.label}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.currentAssignment && item.status === 'ASSIGNED' 
                  ? (
                    <div>
                      <div className="font-medium">{item.currentAssignment.employeeName}</div>
                      <div className="text-xs text-gray-500">
                        Od: {formatDate(item.currentAssignment.assignedDate)}
                      </div>
                    </div>
                  )
                  : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                {formatCurrency(item.purchasePrice)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleItemClick(item)}
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Szczegóły
                  </button>
                  {item.status === 'AVAILABLE' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemForAssignment(item);
                        setShowAssignModal(true);
                      }}
                      className="text-emerald-700 hover:text-emerald-900 transition-colors">
                      Wydaj
                    </button>
                  )}
                  {item.status === 'ASSIGNED' && (
                    <button className="text-slate-700 hover:text-slate-900 transition-colors">
                      Odbierz
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Category Filters
  const CategoryFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <Input
            type="text"
            placeholder="Szukaj sprzętu..."
            value={filters.search}
            onChange={(e) => handleFiltersChange({ search: e.target.value })}
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) => handleFiltersChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
          >
            <option value="">Wszystkie statusy</option>
            <option value="AVAILABLE">Dostępne</option>
            <option value="ASSIGNED">Wydane</option>
            <option value="DAMAGED">Uszkodzone</option>
            <option value="RETIRED">Wycofane</option>
          </select>
        </div>

        {/* Condition Filter */}
        <div>
          <select
            value={filters.condition}
            onChange={(e) => handleFiltersChange({ condition: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
          >
            <option value="">Wszystkie stany</option>
            {EQUIPMENT_CONDITIONS.map(condition => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <Button
            onClick={handleClearFilters}
            variant="outline"
            className="w-full"
          >
            Wyczyść filtry
          </Button>
        </div>
      </div>

      {(filters.search || filters.status || filters.condition) && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Znaleziono {filteredEquipment.length} elementów
            {filters.search && ` dla "${filters.search}"`}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">Ładowanie kategorii...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800">Nie znaleziono kategorii</h3>
          <div className="mt-2 text-sm text-red-700">
            Kategoria o ID "{categoryId}" nie istnieje.
          </div>
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
    <div className="mx-auto">
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <button
              onClick={() => router.push('/dashboard/magazyn')}
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Magazyn
            </button>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                {category.name}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <span className="text-4xl">{category.icon}</span>
            <span>{category.name}</span>
          </h1>
          {category.description && (
            <p className="mt-2 text-gray-600">{category.description}</p>
          )}
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={toggleViewMode}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {viewMode === 'grid' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              )}
            </svg>
            <span>{viewMode === 'grid' ? 'Lista' : 'Siatka'}</span>
          </Button>
          <Button>
            + Dodaj sprzęt
          </Button>
        </div>
      </div>

      {/* Category Stats */}
      <CategoryStatsOverview />

      {/* Filters */}
      <CategoryFilters />

      {/* Equipment Display */}
      {filteredEquipment.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">
            {(filters.search || filters.status || filters.condition) ? '🔍' : '📦'}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {(filters.search || filters.status || filters.condition) 
              ? 'Brak wyników wyszukiwania' 
              : 'Brak sprzętu w tej kategorii'}
          </h3>
          <p className="text-gray-500 mb-6">
            {(filters.search || filters.status || filters.condition)
              ? 'Nie znaleziono sprzętu spełniającego kryteria wyszukiwania.'
              : 'Dodaj pierwszy element do tej kategorii.'}
          </p>
          <div className="flex justify-center space-x-3">
            {(filters.search || filters.status || filters.condition) && (
              <Button onClick={handleClearFilters} variant="outline">
                Wyczyść filtry
              </Button>
            )}
            <Button>
              Dodaj sprzęt
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Results Summary */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-700">
              Wyświetlane {filteredEquipment.length} z {category.totalCount} elementów
              {filters.search && ` dla "${filters.search}"`}
            </div>
          </div>

          {/* Equipment Grid or List */}
          {viewMode === 'grid' ? <EquipmentGridView /> : <EquipmentListView />}
        </>
      )}

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <EquipmentDetailModal
          isOpen={!!selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          equipment={selectedEquipment}
          onUpdate={(updated) => {
            setSelectedEquipment(updated);
            // Here you would typically update the data source
          }}
        />
      )}

      {/* Equipment Assignment Modal */}
      {showAssignModal && selectedItemForAssignment && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedItemForAssignment(null);
          }}
          title="Wydaj sprzęt"
        >
          <div className="p-6">
            {/* Equipment Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">{selectedItemForAssignment.name}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Numer seryjny: <span className="font-mono">{selectedItemForAssignment.serialNumber}</span></p>
                <p>Model: {selectedItemForAssignment.model || 'Brak'}</p>
                <p>Lokalizacja: {selectedItemForAssignment.location}</p>
              </div>
            </div>

            {/* Assignment Form */}
            <div className="space-y-4">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pracownik <span className="text-red-500">*</span>
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
                  required
                >
                  <option value="">Wybierz pracownika</option>
                  <option value="1">Jan Kowalski - Brygadzista</option>
                  <option value="2">Piotr Nowak - Murarz</option>
                  <option value="3">Adam Wiśniewski - Elektryk</option>
                  <option value="4">Tomasz Wójcik - Hydraulik</option>
                  <option value="5">Michał Lewandowski - Malarz</option>
                </select>
              </div>

              {/* Construction Site */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budowa <span className="text-red-500">*</span>
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
                  required
                >
                  <option value="">Wybierz budowę</option>
                  <option value="1">Osiedle Słoneczne - Budynek A</option>
                  <option value="2">Osiedle Zielone - Budynek B</option>
                  <option value="3">Park Handlowy - Hala 1</option>
                  <option value="4">Biurowiec Centrum - Parter</option>
                </select>
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status zamówienia
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="p-3 rounded-lg border-2 transition-all font-medium bg-red-50 border-red-300 hover:bg-red-100 ring-2 ring-red-500"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Nowe</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="p-3 rounded-lg border-2 transition-all font-medium bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">W realizacji</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="p-3 rounded-lg border-2 transition-all font-medium bg-orange-50 border-orange-300 hover:bg-orange-100"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Częściowo</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="p-3 rounded-lg border-2 transition-all font-medium bg-green-50 border-green-300 hover:bg-green-100"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Zrealizowane</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uwagi
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Dodatkowe informacje o wydaniu..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedItemForAssignment(null);
                }}
                variant="outline"
              >
                Anuluj
              </Button>
              <Button
                onClick={() => {
                  // Handle assignment logic here
                  console.log('Assigning equipment:', selectedItemForAssignment);
                  setShowAssignModal(false);
                  setSelectedItemForAssignment(null);
                }}
                variant="primary"
              >
                Wydaj sprzęt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}