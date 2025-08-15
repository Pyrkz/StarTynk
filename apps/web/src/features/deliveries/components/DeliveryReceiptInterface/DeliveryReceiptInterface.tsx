'use client'

import React, { useState } from 'react'
import { 
  ArrowLeft, 
  Save, 
  Camera, 
  Upload, 
  Package, 
  FileText,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCreateDelivery, useDeliveryPhotos } from '../../hooks'
import type { 
  CreateDeliveryInput, 
  CreateDeliveryItemInput, 
  DeliveryPhotoUpload 
} from '../../types'
import {
  DELIVERY_TYPE_LABELS,
  MEASUREMENT_UNITS,
  VEHICLE_TYPES,
  WAREHOUSE_SECTIONS,
  DEFAULT_DELIVERY_VALUES
} from '../../constants'

interface DeliveryReceiptFormData extends Omit<CreateDeliveryInput, 'items'> {
  items: (CreateDeliveryItemInput & { tempId: string })[]
}

export const DeliveryReceiptInterface: React.FC = () => {
  const [formData, setFormData] = useState<DeliveryReceiptFormData>({
    ...DEFAULT_DELIVERY_VALUES,
    supplierName: '',
    deliveryDate: new Date(),
    items: []
  })
  
  const [currentStep, setCurrentStep] = useState<'basic' | 'items' | 'quality' | 'photos'>('basic')
  const [photos, setPhotos] = useState<File[]>([])
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([])
  
  const { createDelivery, isCreating, error: createError } = useCreateDelivery()
  const { uploadPhotos, isUploading } = useDeliveryPhotos()

  const handleInputChange = (field: keyof DeliveryReceiptFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addItem = () => {
    const newItem: CreateDeliveryItemInput & { tempId: string } = {
      tempId: Date.now().toString(),
      itemName: '',
      unit: 'szt',
      orderedQuantity: 0,
      deliveredQuantity: 0
    }
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const updateItem = (tempId: string, field: keyof CreateDeliveryItemInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeItem = (tempId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.tempId !== tempId)
    }))
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setPhotos(prev => [...prev, ...files])
    
    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewPhotos(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPreviewPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    try {
      const deliveryInput: CreateDeliveryInput = {
        ...formData,
        items: formData.items.map(({ tempId, ...item }) => item)
      }
      
      const createdDelivery = await createDelivery(deliveryInput)
      
      // Upload photos if any
      if (photos.length > 0) {
        const fileList = new DataTransfer()
        photos.forEach(photo => fileList.items.add(photo))
        await uploadPhotos(createdDelivery.id, fileList.files)
      }
      
      // Redirect to delivery details
      window.location.href = `/dashboard/dostawy/${createdDelivery.id}`
      
    } catch (error) {
      console.error('Error creating delivery:', error)
    }
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'basic':
        return formData.supplierName && formData.deliveryDate
      case 'items':
        return formData.items.length > 0 && formData.items.every(item => 
          item.itemName && item.deliveredQuantity > 0
        )
      case 'quality':
        return true // Quality check is optional
      case 'photos':
        return true // Photos are optional
      default:
        return false
    }
  }

  const isFormValid = () => {
    return formData.supplierName && 
           formData.deliveryDate && 
           formData.items.length > 0 &&
           formData.items.every(item => item.itemName && item.deliveredQuantity > 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/dashboard/dostawy'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do dostaw
            </Button>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Odbiór dostawy
              </h1>
              <p className="text-sm text-gray-600">
                Rejestracja nowej dostawy materiałów
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentStep !== 'basic' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const steps = ['basic', 'items', 'quality', 'photos']
                  const currentIndex = steps.indexOf(currentStep)
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1] as any)
                  }
                }}
              >
                Poprzedni krok
              </Button>
            )}
            
            {currentStep !== 'photos' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const steps = ['basic', 'items', 'quality', 'photos']
                  const currentIndex = steps.indexOf(currentStep)
                  if (currentIndex < steps.length - 1) {
                    setCurrentStep(steps[currentIndex + 1] as any)
                  }
                }}
                disabled={!canProceedToNextStep()}
              >
                Następny krok
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={!isFormValid() || isCreating || isUploading}
                isLoading={isCreating || isUploading}
              >
                <Save className="w-4 h-4 mr-2" />
                Zapisz dostawę
              </Button>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <div className="mt-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"></div>
            <div 
              className="absolute top-5 left-0 h-0.5 bg-primary-600 transition-all duration-300"
              style={{
                width: `${
                  currentStep === 'basic' ? '0%' :
                  currentStep === 'items' ? '33.33%' :
                  currentStep === 'quality' ? '66.66%' : '100%'
                }%`
              }}
            ></div>
            
            {[
              { key: 'basic', label: 'Podstawowe dane', icon: Package },
              { key: 'items', label: 'Pozycje dostawy', icon: FileText },
              { key: 'quality', label: 'Kontrola jakości', icon: CheckCircle },
              { key: 'photos', label: 'Dokumentacja', icon: Camera }
            ].map(({ key, label, icon: Icon }, index) => (
              <div key={key} className="flex flex-col items-center relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 ${
                    currentStep === key
                      ? 'bg-primary-600 text-white'
                      : ['basic', 'items', 'quality', 'photos'].indexOf(currentStep) > index
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs mt-2 text-center ${
                  currentStep === key ? 'text-primary-600 font-medium' : 'text-gray-600'
                }`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {currentStep === 'basic' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Podstawowe informacje o dostawie
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supplier Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Informacje o dostawcy</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nazwa dostawcy *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.supplierName}
                      onChange={(e) => handleInputChange('supplierName', e.target.value)}
                      placeholder="Wprowadź nazwę dostawcy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kontakt do dostawcy
                    </label>
                    <input
                      type="text"
                      value={formData.supplierContact || ''}
                      onChange={(e) => handleInputChange('supplierContact', e.target.value)}
                      placeholder="Telefon lub email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Driver Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Informacje o kierowcy</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imię i nazwisko kierowcy
                    </label>
                    <input
                      type="text"
                      value={formData.driverName || ''}
                      onChange={(e) => handleInputChange('driverName', e.target.value)}
                      placeholder="Imię i nazwisko"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon kierowcy
                    </label>
                    <input
                      type="tel"
                      value={formData.driverPhone || ''}
                      onChange={(e) => handleInputChange('driverPhone', e.target.value)}
                      placeholder="Numer telefonu"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle and Delivery Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Pojazd</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numer rejestracyjny
                    </label>
                    <input
                      type="text"
                      value={formData.vehiclePlate || ''}
                      onChange={(e) => handleInputChange('vehiclePlate', e.target.value)}
                      placeholder="XX 1234A"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Typ pojazdu
                    </label>
                    <select
                      value={formData.vehicleType || ''}
                      onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Wybierz typ pojazdu</option>
                      {VEHICLE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Dostawa</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data i czas dostawy *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.deliveryDate ? 
                        new Date(formData.deliveryDate.getTime() - formData.deliveryDate.getTimezoneOffset() * 60000)
                          .toISOString().slice(0, 16) : ''
                      }
                      onChange={(e) => handleInputChange('deliveryDate', new Date(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Typ dostawy
                    </label>
                    <select
                      value={formData.deliveryType}
                      onChange={(e) => handleInputChange('deliveryType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {Object.entries(DELIVERY_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numer dokumentu WZ
                    </label>
                    <input
                      type="text"
                      value={formData.deliveryNoteNumber || ''}
                      onChange={(e) => handleInputChange('deliveryNoteNumber', e.target.value)}
                      placeholder="Numer WZ"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Miejsce składowania
                    </label>
                    <select
                      value={formData.storageLocation || ''}
                      onChange={(e) => handleInputChange('storageLocation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Wybierz sekcję magazynu</option>
                      {WAREHOUSE_SECTIONS.map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uwagi do dostawy
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Dodatkowe informacje o dostawie..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 'items' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Pozycje dostawy
                </h2>
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj pozycję
                </Button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Brak pozycji w dostawie
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Dodaj materiały i towary dostarczone w tej dostawie
                  </p>
                  <Button
                    variant="primary"
                    onClick={addItem}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj pierwszą pozycję
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item) => (
                    <div key={item.tempId} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nazwa materiału *
                          </label>
                          <input
                            type="text"
                            required
                            value={item.itemName}
                            onChange={(e) => updateItem(item.tempId, 'itemName', e.target.value)}
                            placeholder="Nazwa materiału"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jednostka
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(item.tempId, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            {MEASUREMENT_UNITS.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Zamówiono
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.orderedQuantity}
                            onChange={(e) => updateItem(item.tempId, 'orderedQuantity', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dostarczone *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            required
                            value={item.deliveredQuantity}
                            onChange={(e) => updateItem(item.tempId, 'deliveredQuantity', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.tempId)}
                            className="text-error-600 hover:text-error-700"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Uwagi do pozycji
                        </label>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateItem(item.tempId, 'notes', e.target.value)}
                          placeholder="Dodatkowe informacje..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 'quality' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Kontrola jakości
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">
                      Informacja o kontroli jakości
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Kontrola jakości może zostać przeprowadzona później. 
                      Możesz zaznaczyć, czy dostawa wymaga kontroli i dodać wstępne uwagi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="qualityRequired"
                    checked={formData.qualityCheckRequired || false}
                    onChange={(e) => handleInputChange('qualityCheckRequired', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="qualityRequired" className="text-sm font-medium text-gray-700">
                    Ta dostawa wymaga kontroli jakości
                  </label>
                </div>

                {formData.qualityCheckRequired && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wstępne uwagi do kontroli jakości
                    </label>
                    <textarea
                      value={formData.qualityNotes || ''}
                      onChange={(e) => handleInputChange('qualityNotes', e.target.value)}
                      placeholder="Opisz ewentualne problemy, uszkodzenia lub uwagi do kontroli..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'photos' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Dokumentacja fotograficzna
              </h2>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Dodaj zdjęcia dostawy
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Zrób lub prześlij zdjęcia dokumentujące stan dostawy, materiałów i ewentualnych problemów
                  </p>
                  
                  <div className="flex items-center justify-center gap-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <span className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-elevation-medium hover:shadow-elevation-high active:bg-primary-800 px-4 py-2.5 text-base cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Prześlij zdjęcia
                      </span>
                    </label>
                    
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <span className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 hover:border-primary-700 active:bg-primary-100 px-4 py-2.5 text-base cursor-pointer">
                        <Camera className="w-4 h-4 mr-2" />
                        Zrób zdjęcie
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {previewPhotos.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Zdjęcia do przesłania ({previewPhotos.length})
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previewPhotos.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Zdjęcie ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {createError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-900">
                    Błąd podczas zapisywania dostawy
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {createError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}