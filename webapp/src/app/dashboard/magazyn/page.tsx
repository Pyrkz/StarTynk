'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { CategoryCard } from '@/features/equipment/components/CategoryCard';
import { EquipmentDetailModal } from '@/features/equipment/components/EquipmentDetailModal';
import { useMockEquipmentData } from '@/features/equipment/hooks/useMockEquipmentData';
import { MockCategory, DetailedEquipmentItem } from '@/features/equipment/types/equipment.types';

export default function WarehousePage() {
  const router = useRouter();
  const { categories, loading, getOverallStats, searchEquipment } = useMockEquipmentData();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<DetailedEquipmentItem | null>(null);
  const [filteredCategories, setFilteredCategories] = useState<MockCategory[]>([]);

  const overallStats = getOverallStats();

  // Filter categories based on search
  const displayCategories = searchQuery 
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  const handleCategoryClick = (category: MockCategory) => {
    router.push(`/dashboard/magazyn/${category.id}`);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const searchResults = searchEquipment(query);
      // Group search results by category for display
      const categoryMap = new Map<string, MockCategory>();
      
      categories.forEach(cat => {
        const matchingEquipment = searchResults.filter(eq => eq.categoryId === cat.id);
        if (matchingEquipment.length > 0) {
          categoryMap.set(cat.id, {
            ...cat,
            equipmentList: matchingEquipment,
            totalCount: matchingEquipment.length,
            availableCount: matchingEquipment.filter(eq => eq.status === 'AVAILABLE').length,
            assignedCount: matchingEquipment.filter(eq => eq.status === 'ASSIGNED').length,
            damagedCount: matchingEquipment.filter(eq => eq.status === 'DAMAGED').length,
          });
        }
      });
      
      setFilteredCategories(Array.from(categoryMap.values()));
    } else {
      setFilteredCategories([]);
    }
  };

  const StatsOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center p-3 bg-slate-100 rounded-md">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Łącznie sprzętu
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {overallStats.total}
              </dd>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-50 rounded-md">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Dostępne
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {overallStats.available}
              </dd>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-md">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Wydane
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {overallStats.assigned}
              </dd>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center p-3 bg-amber-50 rounded-md">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Wymagają uwagi
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {overallStats.damaged + overallStats.maintenanceRequired}
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SearchAndFilters = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Szukaj kategorii lub sprzętu..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={toggleViewMode}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <span>{viewMode === 'grid' ? '📋' : '⊞'}</span>
            <span>{viewMode === 'grid' ? 'Lista' : 'Siatka'}</span>
          </Button>
          <Button
            onClick={() => setShowAddEquipmentModal(true)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <span>🔧</span>
            <span>Dodaj sprzęt</span>
          </Button>
          <Button
            onClick={() => setShowAddCategoryModal(true)}
            className="flex items-center space-x-2"
          >
            <span>📁</span>
            <span>Dodaj kategorię</span>
          </Button>
        </div>
      </div>

      {searchQuery && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filteredCategories.length > 0 ? (
              <>Znaleziono {filteredCategories.reduce((sum, cat) => sum + cat.totalCount, 0)} elementów w {filteredCategories.length} kategoriach</>
            ) : (
              <>Brak wyników dla "{searchQuery}"</>
            )}
          </div>
          <Button
            onClick={() => {
              setSearchQuery('');
              setFilteredCategories([]);
            }}
            variant="outline"
            size="sm"
          >
            Wyczyść wyszukiwanie
          </Button>
        </div>
      )}
    </div>
  );

  const CategoryGrid = () => {
    const categoriesToShow = searchQuery && filteredCategories.length > 0 ? filteredCategories : displayCategories;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categoriesToShow.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onClick={handleCategoryClick}
          />
        ))}
      </div>
    );
  };

  const CategoryList = () => {
    const categoriesToShow = searchQuery && filteredCategories.length > 0 ? filteredCategories : displayCategories;
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Łącznie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dostępne
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wydane
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uszkodzone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dostępność
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categoriesToShow.map((category) => {
              const utilizationRate = category.totalCount > 0 
                ? ((category.assignedCount / category.totalCount) * 100).toFixed(1)
                : '0';
              
              return (
                <tr 
                  key={category.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleCategoryClick(category)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 text-2xl mr-3">
                        {category.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{category.totalCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="success" size="sm">
                      {category.availableCount}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="primary" size="sm">
                      {category.assignedCount}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category.damagedCount > 0 ? (
                      <Badge variant="error" size="sm">
                        {category.damagedCount}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-500">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 max-w-[100px]">
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
                      <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                        {category.availableCount}/{category.totalCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryClick(category);
                      }}
                      className="text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Zarządzaj
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const CategoryDisplay = () => {
    const categoriesToShow = searchQuery && filteredCategories.length > 0 ? filteredCategories : displayCategories;
    
    if (categoriesToShow.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">
            {searchQuery ? '🔍' : '📦'}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'Brak wyników wyszukiwania' : 'Brak kategorii sprzętu'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery 
              ? `Nie znaleziono kategorii ani sprzętu dla "${searchQuery}"`
              : 'Rozpocznij od dodania pierwszej kategorii sprzętu'
            }
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowAddCategoryModal(true)}>
              Dodaj pierwszą kategorię
            </Button>
          )}
        </div>
      );
    }

    return viewMode === 'grid' ? <CategoryGrid /> : <CategoryList />;
  };


  const UtilizationAlert = () => {
    const highUtilizationCategories = categories.filter(cat => {
      const utilization = cat.totalCount > 0 ? (cat.assignedCount / cat.totalCount) * 100 : 0;
      return utilization >= 80;
    });

    if (highUtilizationCategories.length === 0) return null;

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">
              Niski stan magazynowy
            </h3>
            <div className="mt-1 text-sm text-amber-700">
              <div className="flex flex-wrap gap-2">
                {highUtilizationCategories.map(cat => (
                  <span key={cat.id} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
                    {cat.name} ({cat.availableCount}/{cat.totalCount} dostępnych)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">Ładowanie magazynu...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Magazyn sprzętu</h1>
            <p className="mt-2 text-gray-600">
              Zarządzaj kategoriami sprzętu, wydaniami i stanem magazynowym
            </p>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <StatsOverview />

      {/* High Utilization Alert */}
      <UtilizationAlert />

      {/* Search and Filters */}
      <SearchAndFilters />

      {/* Categories Display */}
      <CategoryDisplay />

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <Modal
          isOpen={showAddCategoryModal}
          onClose={() => setShowAddCategoryModal(false)}
          title="Dodaj nową kategorię"
        >
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa kategorii
                </label>
                <Input
                  type="text"
                  placeholder="np. Narzędzia ręczne"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opis
                </label>
                <textarea
                  placeholder="Opis kategorii sprzętu..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ikona (emoji)
                </label>
                <Input
                  type="text"
                  placeholder="🔧"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                onClick={() => setShowAddCategoryModal(false)}
                variant="outline"
              >
                Anuluj
              </Button>
              <Button>
                Dodaj kategorię
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Equipment Modal */}
      {showAddEquipmentModal && (
        <Modal
          isOpen={showAddEquipmentModal}
          onClose={() => setShowAddEquipmentModal(false)}
          title="Dodaj nowy sprzęt"
        >
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa sprzętu
                </label>
                <Input
                  type="text"
                  placeholder="np. Wiertarka Bosch GSB 13 RE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategoria
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Wybierz kategorię</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numer seryjny
                  </label>
                  <Input
                    type="text"
                    placeholder="Numer seryjny"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cena zakupu
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                onClick={() => setShowAddEquipmentModal(false)}
                variant="outline"
              >
                Anuluj
              </Button>
              <Button>
                Dodaj sprzęt
              </Button>
            </div>
          </div>
        </Modal>
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
    </div>
  );
}