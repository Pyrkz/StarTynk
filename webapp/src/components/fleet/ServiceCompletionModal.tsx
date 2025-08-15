'use client'

import { useState } from 'react'
import {
  XIcon,
  CalendarDaysIcon,
  WrenchIcon,
  CheckCircleIcon,
  AlertTriangleIcon
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type {
  VehicleWithServicesEnhanced,
  EnhancedServiceType,
  ScheduleServiceDataEnhanced
} from '@/types/fleet-enhanced'
import { translateServiceTypeEnhanced } from '@/types/fleet-enhanced'

interface ServiceCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (serviceData: ScheduleServiceDataEnhanced) => Promise<boolean>
  vehicle: VehicleWithServicesEnhanced
  serviceType: EnhancedServiceType
  className?: string
}

const ServiceCompletionModal: React.FC<ServiceCompletionModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  vehicle,
  serviceType,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    scheduledDate: new Date().toISOString().split('T')[0],
    mileage: vehicle.currentMileage,
    cost: 0,
    provider: '',
    notes: '',
    nextServiceMileage: 0
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate suggested next service mileage based on vehicle type
  const getSuggestedNextMileage = () => {
    const isDeliveryVehicle = vehicle.type === 'VAN' || vehicle.type === 'TRUCK'
    
    switch (serviceType) {
      case 'ENGINE_OIL':
        return vehicle.currentMileage + (isDeliveryVehicle ? 15000 : 10000)
      case 'TRANSMISSION_OIL':
        return vehicle.currentMileage + (isDeliveryVehicle ? 40000 : 30000)
      default:
        return vehicle.currentMileage + (isDeliveryVehicle ? 30000 : 20000)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Data serwisu jest wymagana'
    }

    if (!formData.mileage || formData.mileage < 0) {
      newErrors.mileage = 'Przebieg musi być większy od 0'
    }

    if (!formData.cost || formData.cost < 0) {
      newErrors.cost = 'Koszt musi być większy od 0'
    }

    if (!formData.provider.trim()) {
      newErrors.provider = 'Nazwa serwisu jest wymagana'
    }

    if (formData.nextServiceMileage && formData.nextServiceMileage <= formData.mileage) {
      newErrors.nextServiceMileage = 'Następny serwis musi być na większym przebiegu'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const serviceData: ScheduleServiceDataEnhanced = {
        vehicleId: vehicle.id,
        serviceType,
        scheduledDate: new Date(formData.scheduledDate),
        mileage: formData.mileage,
        estimatedCost: formData.cost,
        serviceProviderId: '', // Will be set based on provider name
        notes: formData.notes,
        isRecurring: serviceType !== 'REPAIR' && serviceType !== 'TECHNICAL_INSPECTION',
        recurringInterval: formData.nextServiceMileage - formData.mileage,
        specialRequirements: [],
        preferredTime: '09:00',
        // Additional fields for completion
        completed: true,
        actualCost: formData.cost,
        provider: formData.provider,
        nextServiceMileage: formData.nextServiceMileage || getSuggestedNextMileage()
      }

      const success = await onSchedule(serviceData)
      if (!success) {
        setErrors({ general: 'Nie udało się zapisać serwisu' })
      }
    } catch (error) {
      console.error('Failed to complete service:', error)
      setErrors({ general: 'Wystąpił błąd podczas zapisywania' })
    } finally {
      setLoading(false)
    }
  }

  const getServiceIcon = () => {
    switch (serviceType) {
      case 'ENGINE_OIL':
      case 'TRANSMISSION_OIL':
        return <WrenchIcon className="w-5 h-5 text-blue-600" />
      case 'TECHNICAL_INSPECTION':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'REPAIR':
        return <AlertTriangleIcon className="w-5 h-5 text-red-600" />
      default:
        return <WrenchIcon className="w-5 h-5 text-blue-600" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {getServiceIcon()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Wypełnij informacje o serwisie
              </h2>
              <p className="text-sm text-gray-600">
                {translateServiceTypeEnhanced(serviceType)} - {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <XIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data wykonania serwisu
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.scheduledDate && (
                <p className="text-red-600 text-sm mt-1">{errors.scheduledDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Przebieg podczas serwisu (km)
              </label>
              <Input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData(prev => ({ ...prev, mileage: Number(e.target.value) }))}
                placeholder={vehicle.currentMileage.toString()}
                className="w-full"
              />
              {errors.mileage && (
                <p className="text-red-600 text-sm mt-1">{errors.mileage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Koszt serwisu (PLN)
              </label>
              <Input
                type="number"
                value={formData.cost || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                placeholder="0"
                className="w-full"
              />
              {errors.cost && (
                <p className="text-red-600 text-sm mt-1">{errors.cost}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serwis / Warsztat
              </label>
              <Input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                placeholder="Nazwa serwisu"
                className="w-full"
              />
              {errors.provider && (
                <p className="text-red-600 text-sm mt-1">{errors.provider}</p>
              )}
            </div>
          </div>

          {/* Next Service Planning */}
          {(serviceType === 'ENGINE_OIL' || serviceType === 'TRANSMISSION_OIL') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Następny serwis przy przebiegu (km)
              </label>
              <Input
                type="number"
                value={formData.nextServiceMileage || getSuggestedNextMileage()}
                onChange={(e) => setFormData(prev => ({ ...prev, nextServiceMileage: Number(e.target.value) }))}
                placeholder={getSuggestedNextMileage().toString()}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Sugerowany przebieg: {getSuggestedNextMileage().toLocaleString()} km
                {vehicle.type === 'VAN' || vehicle.type === 'TRUCK' ? ' (pojazd dostawczy)' : ' (pojazd osobowy)'}
              </p>
              {errors.nextServiceMileage && (
                <p className="text-red-600 text-sm mt-1">{errors.nextServiceMileage}</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dodatkowe uwagi
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Opcjonalne uwagi dotyczące wykonanego serwisu..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Service Type Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Informacje o serwisie
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Typ:</span> {translateServiceTypeEnhanced(serviceType)}</p>
              <p><span className="font-medium">Pojazd:</span> {vehicle.make} {vehicle.model}</p>
              <p><span className="font-medium">Rejestracja:</span> {vehicle.licensePlate}</p>
              <p><span className="font-medium">Aktualny przebieg:</span> {vehicle.currentMileage.toLocaleString()} km</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <CalendarDaysIcon className="w-4 h-4" />
                Zapisz serwis
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ServiceCompletionModal