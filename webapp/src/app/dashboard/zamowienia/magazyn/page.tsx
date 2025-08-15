'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { 
  Material, 
  WarehouseMovement, 
  WarehouseMovementType,
  MaterialCategory 
} from '@/types/materials';

interface WarehouseItem {
  materialId: string;
  material: Material;
  quantity: number;
  location?: string;
  condition: 'GOOD' | 'DAMAGED' | 'EXPIRED';
  notes?: string;
}

type OperationType = 'RETURN' | 'CHECKOUT' | 'TRANSFER' | 'ADJUSTMENT';

export default function WarehousePage() {
  const [operationType, setOperationType] = useState<OperationType>('RETURN');
  const [selectedProject, setSelectedProject] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [notes, setNotes] = useState('');

  // Mock data
  const mockProjects = [
    { id: 'proj-1', name: 'Osiedle Słoneczne - Budynek A', address: 'ul. Słoneczna 15, Warszawa' },
    { id: 'proj-2', name: 'Biurowiec City Center', address: 'ul. Centralna 25, Kraków' },
    { id: 'proj-3', name: 'Hotel Marina', address: 'ul. Portowa 8, Gdańsk' },
  ];

  const mockCategories: MaterialCategory[] = [
    { id: 'cat-1', name: 'Materiały budowlane', icon: '🧱', sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat-2', name: 'Narzędzia ręczne', icon: '🔧', sortOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat-3', name: 'Narzędzia elektryczne', icon: '⚡', sortOrder: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat-4', name: 'Materiały wykończeniowe', icon: '🎨', sortOrder: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat-5', name: 'Wyposażenie BHP', icon: '🦺', sortOrder: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockMaterials: Material[] = [
    {
      id: 'mat-1',
      name: 'Cement Portland CEM I 42,5R',
      categoryId: 'cat-1',
      unit: 'worek 25kg',
      price: 18.50,
      stockLevel: 150,
      minStock: 50,
      reservedStock: 0,
      isOrderable: true,
      requiresApproval: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mat-2',
      name: 'Młotek murarski 500g',
      categoryId: 'cat-2',
      unit: 'szt',
      price: 45.00,
      stockLevel: 25,
      minStock: 10,
      reservedStock: 2,
      isOrderable: true,
      requiresApproval: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mat-3',
      name: 'Wiertarka udarowa Makita HP2050',
      categoryId: 'cat-3',
      unit: 'szt',
      price: 380.00,
      stockLevel: 8,
      minStock: 5,
      reservedStock: 1,
      isOrderable: true,
      requiresApproval: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mat-4',
      name: 'Farba emulsyjna biała 10L',
      categoryId: 'cat-4',
      unit: 'wiadro 10L',
      price: 65.00,
      stockLevel: 40,
      minStock: 20,
      reservedStock: 5,
      isOrderable: true,
      requiresApproval: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mat-5',
      name: 'Kask ochronny biały',
      categoryId: 'cat-5',
      unit: 'szt',
      price: 25.00,
      stockLevel: 60,
      minStock: 30,
      reservedStock: 0,
      isOrderable: true,
      requiresApproval: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockLocations = [
    'Magazyn główny - Strefa A',
    'Magazyn główny - Strefa B',
    'Magazyn główny - Strefa C',
    'Magazyn narzędzi',
    'Magazyn BHP',
    'Magazyn chemiczny',
    'Strefa odbioru',
    'Strefa ekspedycji'
  ];

  const filteredMaterials = mockMaterials.filter(material => {
    const matchesCategory = !selectedCategory || material.categoryId === selectedCategory;
    const matchesSearch = !searchQuery || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const addMaterialToWarehouse = (material: Material, quantity: number = 1) => {
    const existingItemIndex = warehouseItems.findIndex(item => item.materialId === material.id);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...warehouseItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setWarehouseItems(updatedItems);
    } else {
      const newItem: WarehouseItem = {
        materialId: material.id,
        material,
        quantity,
        condition: 'GOOD'
      };
      setWarehouseItems([...warehouseItems, newItem]);
    }
  };

  const updateWarehouseItemQuantity = (materialId: string, quantity: number) => {
    if (quantity <= 0) {
      setWarehouseItems(warehouseItems.filter(item => item.materialId !== materialId));
      return;
    }

    const updatedItems = warehouseItems.map(item => {
      if (item.materialId === materialId) {
        return { ...item, quantity };
      }
      return item;
    });
    setWarehouseItems(updatedItems);
  };

  const updateWarehouseItemCondition = (materialId: string, condition: 'GOOD' | 'DAMAGED' | 'EXPIRED') => {
    const updatedItems = warehouseItems.map(item => {
      if (item.materialId === materialId) {
        return { ...item, condition };
      }
      return item;
    });
    setWarehouseItems(updatedItems);
  };

  const updateWarehouseItemLocation = (materialId: string, location: string) => {
    const updatedItems = warehouseItems.map(item => {
      if (item.materialId === materialId) {
        return { ...item, location };
      }
      return item;
    });
    setWarehouseItems(updatedItems);
  };

  const updateWarehouseItemNotes = (materialId: string, notes: string) => {
    const updatedItems = warehouseItems.map(item => {
      if (item.materialId === materialId) {
        return { ...item, notes };
      }
      return item;
    });
    setWarehouseItems(updatedItems);
  };

  const removeWarehouseItem = (materialId: string) => {
    setWarehouseItems(warehouseItems.filter(item => item.materialId !== materialId));
  };

  const handleSubmitMovement = async () => {
    const movementData = {
      type: getMovementType(),
      projectId: selectedProject || undefined,
      targetLocation,
      reason: movementReason,
      notes,
      items: warehouseItems.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        condition: item.condition,
        location: item.location,
        notes: item.notes
      }))
    };

    console.log('Submitting warehouse movement:', movementData);
    alert('Operacja magazynowa została zarejestrowana!');
    
    // Reset form
    setWarehouseItems([]);
    setMovementReason('');
    setNotes('');
  };

  const getMovementType = (): WarehouseMovementType => {
    switch (operationType) {
      case 'RETURN': return 'RETURN';
      case 'CHECKOUT': return 'OUT';
      case 'TRANSFER': return 'TRANSFER';
      case 'ADJUSTMENT': return 'ADJUSTMENT';
      default: return 'RETURN';
    }
  };

  const getOperationTitle = (): string => {
    switch (operationType) {
      case 'RETURN': return 'Zwrot do magazynu';
      case 'CHECKOUT': return 'Wydanie z magazynu';
      case 'TRANSFER': return 'Przeniesienie między lokalizacjami';
      case 'ADJUSTMENT': return 'Korekta stanu magazynowego';
      default: return 'Operacja magazynowa';
    }
  };

  const getConditionLabel = (condition: 'GOOD' | 'DAMAGED' | 'EXPIRED'): string => {
    switch (condition) {
      case 'GOOD': return 'Dobry';
      case 'DAMAGED': return 'Uszkodzony';
      case 'EXPIRED': return 'Przeterminowany';
      default: return condition;
    }
  };

  const getConditionColor = (condition: 'GOOD' | 'DAMAGED' | 'EXPIRED'): string => {
    switch (condition) {
      case 'GOOD': return 'bg-green-100 text-green-800';
      case 'DAMAGED': return 'bg-red-100 text-red-800';
      case 'EXPIRED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operacje magazynowe</h1>
          <p className="text-gray-600 mt-1">Zarządzaj zwrotami, wydaniami i transferami materiałów</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/zamowienia">
            ← Powrót do zamówień
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operation Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Operation Type Selection */}
          <div className="bg-white rounded-lg shadow-elevation-medium p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Typ operacji</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { type: 'RETURN', label: 'Zwrot', icon: '📥', desc: 'Zwrot materiałów do magazynu' },
                { type: 'CHECKOUT', label: 'Wydanie', icon: '📤', desc: 'Wydanie materiałów z magazynu' },
                { type: 'TRANSFER', label: 'Transfer', icon: '🔄', desc: 'Przeniesienie między lokalizacjami' },
                { type: 'ADJUSTMENT', label: 'Korekta', icon: '⚖️', desc: 'Korekta stanu magazynowego' },
              ].map((op) => (
                <button
                  key={op.type}
                  onClick={() => setOperationType(op.type as OperationType)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    operationType === op.type
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="text-2xl mb-2">{op.icon}</div>
                  <div className="font-medium text-gray-900">{op.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{op.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Operation Details */}
          <div className="bg-white rounded-lg shadow-elevation-medium p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{getOperationTitle()}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(operationType === 'CHECKOUT' || operationType === 'RETURN') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Projekt {operationType === 'CHECKOUT' ? '(docelowy)' : '(źródłowy)'}
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Wybierz projekt</option>
                    {mockProjects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {operationType === 'TRANSFER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokalizacja docelowa
                  </label>
                  <select
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Wybierz lokalizację</option>
                    {mockLocations.map(location => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={operationType === 'TRANSFER' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Powód operacji
                </label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Opisz powód wykonania operacji"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dodatkowe uwagi
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Dodatkowe informacje o operacji..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Material Catalog */}
          <div className="bg-white rounded-lg shadow-elevation-medium p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Katalog materiałów</h2>
              <Button
                variant="outline"
                onClick={() => setShowCatalog(!showCatalog)}
              >
                {showCatalog ? 'Ukryj katalog' : 'Pokaż katalog'}
              </Button>
            </div>

            {showCatalog && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Szukaj materiałów..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Wszystkie kategorie</option>
                      {mockCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Materials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMaterials.map(material => (
                    <div key={material.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{material.name}</h3>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <div>Stan magazynowy: <span className="font-medium">{material.stockLevel} {material.unit}</span></div>
                        <div>Zarezerwowane: <span className="font-medium">{material.reservedStock} {material.unit}</span></div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => addMaterialToWarehouse(material)}
                        className="w-full"
                      >
                        Dodaj do operacji
                      </Button>
                    </div>
                  ))}
                </div>

                {filteredMaterials.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-gray-600">Nie znaleziono materiałów spełniających kryteria wyszukiwania.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Operation Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-elevation-medium p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Podsumowanie operacji</h2>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900">Typ operacji:</div>
              <div className="text-blue-800">{getOperationTitle()}</div>
            </div>
            
            {warehouseItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-600">Lista jest pusta</p>
                <p className="text-sm text-gray-500 mt-1">Dodaj materiały z katalogu</p>
              </div>
            ) : (
              <div className="space-y-4">
                {warehouseItems.map(item => (
                  <div key={item.materialId} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{item.material.name}</h4>
                      <button
                        onClick={() => removeWarehouseItem(item.materialId)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Quantity */}
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateWarehouseItemQuantity(item.materialId, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-sm text-gray-600">{item.material.unit}</span>
                    </div>
                    
                    {/* Condition */}
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600 mb-1">Stan:</label>
                      <select
                        value={item.condition}
                        onChange={(e) => updateWarehouseItemCondition(item.materialId, e.target.value as 'GOOD' | 'DAMAGED' | 'EXPIRED')}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="GOOD">Dobry</option>
                        <option value="DAMAGED">Uszkodzony</option>
                        <option value="EXPIRED">Przeterminowany</option>
                      </select>
                    </div>
                    
                    {/* Location */}
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600 mb-1">Lokalizacja:</label>
                      <select
                        value={item.location || ''}
                        onChange={(e) => updateWarehouseItemLocation(item.materialId, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Wybierz lokalizację</option>
                        {mockLocations.map(location => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Notes */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Uwagi:</label>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => updateWarehouseItemNotes(item.materialId, e.target.value)}
                        placeholder="Dodatkowe informacje"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    
                    <div className="mt-2">
                      <Badge className={cn(getConditionColor(item.condition))}>
                        {getConditionLabel(item.condition)}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                <Button
                  onClick={handleSubmitMovement}
                  disabled={warehouseItems.length === 0 || !movementReason.trim()}
                  className="w-full"
                >
                  Wykonaj operację
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}