'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type { Material, MaterialCategory } from '@/types/materials';

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'category' | 'price' | 'stock';

export default function CatalogPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showStockFilter, setShowStockFilter] = useState('ALL');

  // Mock data
  const mockCategories: MaterialCategory[] = [
    { id: 'cat-1', name: 'Materiały budowlane', icon: '🧱', sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat-2', name: 'Narzędzia ręczne', icon: '🔧', sortOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat-3', name: 'Narzędzia elektryczne', icon: '⚡', sortOrder: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat-4', name: 'Materiały wykończeniowe', icon: '🎨', sortOrder: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat-5', name: 'Wyposażenie BHP', icon: '🦺', sortOrder: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat-6', name: 'Materiały izolacyjne', icon: '🏠', sortOrder: 6, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockMaterials: Material[] = [
    {
      id: 'mat-1',
      name: 'Cement Portland CEM I 42,5R',
      categoryId: 'cat-1',
      sku: 'CEM-001',
      unit: 'worek 25kg',
      price: 18.50,
      primarySupplier: 'Cemex Polska',
      description: 'Wysokiej jakości cement portlandzki do konstrukcji betonowych',
      stockLevel: 150,
      minStock: 50,
      reservedStock: 0,
      isOrderable: true,
      requiresApproval: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: '/images/cement.jpg'
    },
    {
      id: 'mat-2',
      name: 'Młotek murarski 500g',
      categoryId: 'cat-2',
      sku: 'MLO-002',
      unit: 'szt',
      price: 45.00,
      primarySupplier: 'Stanley Tools',
      description: 'Profesjonalny młotek murarski z rączką z włókna szklanego',
      stockLevel: 25,
      minStock: 10,
      reservedStock: 2,
      isOrderable: true,
      requiresApproval: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: '/images/hammer.jpg'
    },
    {
      id: 'mat-3',
      name: 'Wiertarka udarowa Makita HP2050',
      categoryId: 'cat-3',
      sku: 'WIE-003',
      unit: 'szt',
      price: 380.00,
      primarySupplier: 'Makita Sp. z o.o.',
      description: 'Profesjonalna wiertarka udarowa 720W z regulacją prędkości',
      stockLevel: 8,
      minStock: 5,
      reservedStock: 1,
      isOrderable: true,
      requiresApproval: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: '/images/drill.jpg'
    },
    {
      id: 'mat-4',
      name: 'Farba emulsyjna biała 10L',
      categoryId: 'cat-4',
      sku: 'FAR-004',
      unit: 'wiadro 10L',
      price: 65.00,
      primarySupplier: 'Tikkurila',
      description: 'Wysokiej jakości farba emulsyjna do wnętrz',
      stockLevel: 40,
      minStock: 20,
      reservedStock: 5,
      isOrderable: true,
      requiresApproval: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: '/images/paint.jpg'
    },
    {
      id: 'mat-5',
      name: 'Kask ochronny biały',
      categoryId: 'cat-5',
      sku: 'KAS-005',
      unit: 'szt',
      price: 25.00,
      primarySupplier: '3M Polska',
      description: 'Kask ochronny zgodny z normami CE',
      stockLevel: 60,
      minStock: 30,
      reservedStock: 0,
      isOrderable: true,
      requiresApproval: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: '/images/helmet.jpg'
    },
    {
      id: 'mat-6',
      name: 'Styropian fasadowy EPS 100',
      categoryId: 'cat-6',
      sku: 'STY-006',
      unit: 'm²',
      price: 12.80,
      primarySupplier: 'Austrotherm',
      description: 'Płyty styropianowe do izolacji fasad grubość 10cm',
      stockLevel: 5,
      minStock: 50,
      reservedStock: 0,
      isOrderable: true,
      requiresApproval: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: '/images/styrofoam.jpg'
    }
  ];

  // Filter and sort materials
  const filteredMaterials = mockMaterials
    .filter(material => {
      // Category filter
      if (selectedCategory && material.categoryId !== selectedCategory) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          material.name.toLowerCase().includes(query) ||
          material.sku?.toLowerCase().includes(query) ||
          material.description?.toLowerCase().includes(query) ||
          material.primarySupplier?.toLowerCase().includes(query)
        );
      }
      
      // Stock filter
      if (showStockFilter === 'LOW_STOCK') {
        return material.stockLevel <= material.minStock;
      } else if (showStockFilter === 'OUT_OF_STOCK') {
        return material.stockLevel === 0;
      } else if (showStockFilter === 'IN_STOCK') {
        return material.stockLevel > 0;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          const categoryA = mockCategories.find(c => c.id === a.categoryId)?.name || '';
          const categoryB = mockCategories.find(c => c.id === b.categoryId)?.name || '';
          return categoryA.localeCompare(categoryB);
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'stock':
          return b.stockLevel - a.stockLevel;
        default:
          return 0;
      }
    });

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setShowEditModal(true);
  };

  const getStockStatus = (material: Material) => {
    if (material.stockLevel === 0) {
      return { label: 'Brak w magazynie', color: 'bg-red-100 text-red-800' };
    } else if (material.stockLevel <= material.minStock) {
      return { label: 'Niski stan', color: 'bg-orange-100 text-orange-800' };
    } else {
      return { label: 'W magazynie', color: 'bg-green-100 text-green-800' };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Katalog materiałów i narzędzi</h1>
          <p className="text-gray-600 mt-1">Zarządzaj katalogiem dostępnych produktów</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/zamowienia">
              ← Powrót do zamówień
            </Link>
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            ➕ Dodaj produkt
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-elevation-medium p-6">
          <div className="text-sm text-gray-600 mb-1">Wszystkie produkty</div>
          <div className="text-2xl font-bold text-gray-900">{mockMaterials.length}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-elevation-medium p-6">
          <div className="text-sm text-gray-600 mb-1">W magazynie</div>
          <div className="text-2xl font-bold text-green-600">
            {mockMaterials.filter(m => m.stockLevel > 0).length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-elevation-medium p-6">
          <div className="text-sm text-gray-600 mb-1">Niski stan</div>
          <div className="text-2xl font-bold text-orange-600">
            {mockMaterials.filter(m => m.stockLevel > 0 && m.stockLevel <= m.minStock).length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-elevation-medium p-6">
          <div className="text-sm text-gray-600 mb-1">Brak w magazynie</div>
          <div className="text-2xl font-bold text-red-600">
            {mockMaterials.filter(m => m.stockLevel === 0).length}
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-elevation-medium p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Szukaj po nazwie, SKU, opisie lub dostawcy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Wszystkie kategorie</option>
              {mockCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            
            <select
              value={showStockFilter}
              onChange={(e) => setShowStockFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ALL">Wszystkie stany</option>
              <option value="IN_STOCK">W magazynie</option>
              <option value="LOW_STOCK">Niski stan</option>
              <option value="OUT_OF_STOCK">Brak w magazynie</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="name">Nazwa</option>
              <option value="category">Kategoria</option>
              <option value="price">Cena</option>
              <option value="stock">Stan magazynowy</option>
            </select>
          </div>
          
          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-2 text-sm',
                viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              🔲 Siatka
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-2 text-sm border-l border-gray-300',
                viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              📋 Lista
            </button>
          </div>
        </div>

        {/* Materials Display */}
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak produktów</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory || showStockFilter !== 'ALL' 
                ? 'Nie znaleziono produktów spełniających kryteria wyszukiwania.'
                : 'Nie masz jeszcze żadnych produktów w katalogu.'
              }
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMaterials.map(material => {
              const stockStatus = getStockStatus(material);
              const category = mockCategories.find(c => c.id === material.categoryId);
              
              return (
                <div key={material.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-elevation-medium transition-shadow">
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    {material.imageUrl ? (
                      <img
                        src={material.imageUrl}
                        alt={material.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className="text-4xl text-gray-400" style={material.imageUrl ? {display: 'none'} : {}}>
                      {category?.icon || '📦'}
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight">
                        {material.name}
                      </h3>
                      {material.requiresApproval && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-2">
                          Zatwierdzenie
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      <div>SKU: {material.sku}</div>
                      <div>Kategoria: {category?.name}</div>
                      <div>Dostawca: {material.primarySupplier}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {material.price?.toFixed(2)} zł/{material.unit}
                      </div>
                      <Badge className={cn(stockStatus.color, 'text-xs')}>
                        {stockStatus.label}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      Stan: {material.stockLevel} {material.unit}
                      {material.reservedStock > 0 && (
                        <span className="text-orange-600"> (zarez. {material.reservedStock})</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditMaterial(material)}
                        className="flex-1 text-xs"
                      >
                        ✏️ Edytuj
                      </Button>
                      <Button
                        size="sm"
                        variant={material.isActive ? 'ghost' : 'outline'}
                        className="text-xs"
                      >
                        {material.isActive ? '🚫' : '✅'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produkt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cena
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dostawca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMaterials.map(material => {
                  const stockStatus = getStockStatus(material);
                  const category = mockCategories.find(c => c.id === material.categoryId);
                  
                  return (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-lg">{category?.icon || '📦'}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{material.name}</div>
                            <div className="text-sm text-gray-500">{material.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {material.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {material.price?.toFixed(2)} zł/{material.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge className={cn(stockStatus.color)}>
                            {stockStatus.label}
                          </Badge>
                          <div className="text-xs text-gray-600">
                            {material.stockLevel} {material.unit}
                            {material.reservedStock > 0 && (
                              <span className="text-orange-600"> (zarez. {material.reservedStock})</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {material.primarySupplier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMaterial(material)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            ✏️ Edytuj
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            🚫 Dezaktywuj
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Material Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Dodaj nowy produkt"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Formularz dodawania nowego produktu do katalogu będzie tutaj zaimplementowany.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Anuluj
            </Button>
            <Button onClick={() => setShowAddModal(false)}>
              Dodaj produkt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Material Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMaterial(null);
        }}
        title={`Edytuj: ${editingMaterial?.name}`}
      >
        <div className="space-y-4">
          <p className="text-gray-600">Formularz edycji produktu będzie tutaj zaimplementowany.</p>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditModal(false);
                setEditingMaterial(null);
              }}
            >
              Anuluj
            </Button>
            <Button 
              onClick={() => {
                setShowEditModal(false);
                setEditingMaterial(null);
              }}
            >
              Zapisz zmiany
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}