'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { Material, MaterialCategory, OrderPriority, OrderDeliveryType } from '@/types/materials';

interface OrderItem {
  materialId: string;
  material: Material;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export default function NewOrderPage() {
  const [selectedProject, setSelectedProject] = useState('');
  const [priority, setPriority] = useState<OrderPriority>('NORMAL');
  const [deliveryType, setDeliveryType] = useState<OrderDeliveryType>('TO_SITE');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [neededDate, setNeededDate] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for development
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
      updatedAt: new Date(),
      imageUrl: '/images/cement.jpg',
      description: 'Wysokiej jakości cement portlandzki do konstrukcji betonowych'
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
      updatedAt: new Date(),
      imageUrl: '/images/hammer.jpg',
      description: 'Profesjonalny młotek murarski z rączką z włókna szklanego'
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
      updatedAt: new Date(),
      imageUrl: '/images/drill.jpg',
      description: 'Profesjonalna wiertarka udarowa 720W z regulacją prędkości'
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
      updatedAt: new Date(),
      imageUrl: '/images/paint.jpg',
      description: 'Wysokiej jakości farba emulsyjna do wnętrz'
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
      updatedAt: new Date(),
      imageUrl: '/images/helmet.jpg',
      description: 'Kask ochronny zgodny z normami CE'
    }
  ];

  const filteredMaterials = mockMaterials.filter(material => {
    const matchesCategory = !selectedCategory || material.categoryId === selectedCategory;
    const matchesSearch = !searchQuery || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch && material.isOrderable;
  });

  const addMaterialToOrder = (material: Material, quantity: number = 1) => {
    const existingItemIndex = orderItems.findIndex(item => item.materialId === material.id);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].totalPrice = updatedItems[existingItemIndex].quantity * material.price!;
      setOrderItems(updatedItems);
    } else {
      const newItem: OrderItem = {
        materialId: material.id,
        material,
        quantity,
        unitPrice: material.price!,
        totalPrice: quantity * material.price!,
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  const updateOrderItemQuantity = (materialId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(orderItems.filter(item => item.materialId !== materialId));
      return;
    }

    const updatedItems = orderItems.map(item => {
      if (item.materialId === materialId) {
        return {
          ...item,
          quantity,
          totalPrice: quantity * item.unitPrice
        };
      }
      return item;
    });
    setOrderItems(updatedItems);
  };

  const removeOrderItem = (materialId: string) => {
    setOrderItems(orderItems.filter(item => item.materialId !== materialId));
  };

  const totalOrderValue = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSubmitOrder = async () => {
    // Here you would send the order to your API
    const orderData = {
      projectId: selectedProject,
      priority,
      deliveryType,
      deliveryAddress: deliveryType === 'TO_SITE' ? deliveryAddress : undefined,
      neededDate: neededDate ? new Date(neededDate) : undefined,
      notes,
      items: orderItems.map(item => ({
        materialId: item.materialId,
        requestedQuantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes
      })),
      totalAmount: totalOrderValue
    };

    console.log('Submitting order:', orderData);
    // Implement API call here
    alert('Zamówienie zostało złożone!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nowe zamówienie</h1>
          <p className="text-gray-600 mt-1">Złóż zamówienie na materiały i narzędzia</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/zamowienia">
            ← Powrót do zamówień
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-elevation-medium p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacje podstawowe</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projekt budowlany *
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Wybierz projekt</option>
                  {mockProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorytet
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as OrderPriority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="LOW">Niski</option>
                  <option value="NORMAL">Normalny</option>
                  <option value="HIGH">Wysoki</option>
                  <option value="URGENT">Pilny</option>
                  <option value="CRITICAL">Krytyczny</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ dostawy
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as OrderDeliveryType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="TO_SITE">Dostawa na plac budowy</option>
                  <option value="TO_WAREHOUSE">Dostawa do magazynu</option>
                  <option value="PICKUP">Odbiór własny</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data potrzeby
                </label>
                <input
                  type="date"
                  value={neededDate}
                  onChange={(e) => setNeededDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {deliveryType === 'TO_SITE' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres dostawy (opcjonalnie)
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Zostaw puste aby użyć adresu projektu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uwagi do zamówienia
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Dodatkowe informacje o zamówieniu..."
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
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{material.name}</h3>
                        {material.requiresApproval && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            Wymaga zatwierdzenia
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{material.description}</p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm text-gray-600">
                          <div>Cena: <span className="font-medium">{material.price?.toFixed(2)} zł/{material.unit}</span></div>
                          <div>Stan: <span className={cn(
                            'font-medium',
                            material.stockLevel > material.minStock ? 'text-green-600' : 'text-red-600'
                          )}>{material.stockLevel} {material.unit}</span></div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => addMaterialToOrder(material)}
                        disabled={material.stockLevel <= 0}
                        className="w-full"
                      >
                        {material.stockLevel <= 0 ? 'Brak w magazynie' : 'Dodaj do zamówienia'}
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

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-elevation-medium p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Podsumowanie zamówienia</h2>
            
            {orderItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-gray-600">Koszyk jest pusty</p>
                <p className="text-sm text-gray-500 mt-1">Dodaj materiały z katalogu</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderItems.map(item => (
                  <div key={item.materialId} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{item.material.name}</h4>
                      <button
                        onClick={() => removeOrderItem(item.materialId)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateOrderItemQuantity(item.materialId, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-sm text-gray-600">{item.material.unit}</span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div>Cena jednostkowa: {item.unitPrice.toFixed(2)} zł</div>
                      <div className="font-medium">Razem: {item.totalPrice.toFixed(2)} zł</div>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Łączna wartość:</span>
                    <span>{totalOrderValue.toFixed(2)} zł</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleSubmitOrder}
                  disabled={!selectedProject || orderItems.length === 0}
                  className="w-full"
                >
                  Złóż zamówienie
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}