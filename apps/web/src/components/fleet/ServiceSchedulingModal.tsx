'use client'

import { useState, useEffect } from 'react'
import {
  XIcon,
  CalendarDaysIcon,
  WrenchIcon,
  DollarSignIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  UserIcon
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import type {
  ScheduleServiceDataEnhanced,
  EnhancedServiceType,
  ServiceProvider,
  VehicleWithServicesEnhanced
} from '@/types/fleet-enhanced'
import { 
  translateServiceTypeEnhanced,
  mockServiceProviders
} from '@/types/fleet-enhanced'

interface ServiceSchedulingModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (serviceData: ScheduleServiceDataEnhanced) => Promise<boolean>
  vehicle: VehicleWithServicesEnhanced
  serviceType: EnhancedServiceType
  preselectedProvider?: string
  className?: string
}

const ServiceSchedulingModal: React.FC<ServiceSchedulingModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  vehicle,
  serviceType,
  preselectedProvider,
  className = ''
}) => {
  const [formData, setFormData] = useState<Partial<ScheduleServiceDataEnhanced>>({
    vehicleId: vehicle.id,
    serviceType,
    scheduledDate: new Date(),
    estimatedCost: 0,
    serviceProviderId: preselectedProvider || '',
    notes: '',
    isRecurring: false,
    recurringInterval: 5000,
    specialRequirements: [],
    preferredTime: '09:00'
  })

  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'details' | 'provider' | 'confirmation'>('details')

  // Filter providers based on service type
  const availableProviders = mockServiceProviders.filter(provider =>
    provider.specialties.includes(serviceType) &&
    provider.preferredForVehicleTypes.includes(vehicle.type)
  )

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        vehicleId: vehicle.id,
        serviceType,
        scheduledDate: new Date(),
        estimatedCost: 0,
        serviceProviderId: preselectedProvider || '',
        notes: '',
        isRecurring: false,
        recurringInterval: serviceType === 'ENGINE_OIL' ? 5000 : 
                          serviceType === 'TRANSMISSION_OIL' ? 25000 : 0,
        specialRequirements: [],
        preferredTime: '09:00'
      })
      setStep('details')
      setErrors({})
      setLoading(false)

      // Auto-select provider if preselected
      if (preselectedProvider) {
        const provider = availableProviders.find(p => p.id === preselectedProvider)
        if (provider) {
          setSelectedProvider(provider)
          const servicePrice = provider.priceList.find(p => p.serviceType === serviceType)
          if (servicePrice) {
            setFormData(prev => ({ 
              ...prev, 
              estimatedCost: servicePrice.averageCost,
              serviceProviderId: provider.id
            }))
          }
        }
      }
    }
  }, [isOpen, vehicle.id, serviceType, preselectedProvider, availableProviders])

  const handleProviderSelect = (provider: ServiceProvider) => {
    setSelectedProvider(provider)
    const servicePrice = provider.priceList.find(p => p.serviceType === serviceType)
    setFormData(prev => ({
      ...prev,
      serviceProviderId: provider.id,
      estimatedCost: servicePrice?.averageCost || 0
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.scheduledDate || formData.scheduledDate < new Date()) {
      newErrors.scheduledDate = 'Data serwisu musi być w przyszłości'
    }

    if (!formData.serviceProviderId) {
      newErrors.serviceProviderId = 'Wybierz serwisant'
    }

    if (!formData.estimatedCost || formData.estimatedCost <= 0) {
      newErrors.estimatedCost = 'Podaj szacowany koszt'
    }

    if (!formData.preferredTime) {
      newErrors.preferredTime = 'Wybierz preferowaną godzinę'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const success = await onSchedule(formData as ScheduleServiceDataEnhanced)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Failed to schedule service:', error)
    } finally {
      setLoading(false)
    }
  }

  const getServiceTypeInfo = () => {
    switch (serviceType) {
      case 'ENGINE_OIL':
        return {
          icon: <WrenchIcon className="w-5 h-5" />,
          description: 'Wymiana oleju silnikowego i filtra oleju',
          interval: '5,000 km lub 6 miesięcy',
          estimatedDuration: '30-45 minut'
        }
      case 'TRANSMISSION_OIL':
        return {
          icon: <WrenchIcon className="w-5 h-5" />,
          description: 'Wymiana oleju przekładniowego i filtra (jeśli dotyczy)',
          interval: '25,000 km lub 2 lata',
          estimatedDuration: '60-90 minut'
        }
      case 'TECHNICAL_INSPECTION':
        return {
          icon: <CheckCircleIcon className="w-5 h-5" />,
          description: 'Obowiązkowy przegląd techniczny pojazdu',
          interval: 'Raz w roku',
          estimatedDuration: '30-60 minut'
        }
      case 'REPAIR':
        return {
          icon: <AlertTriangleIcon className="w-5 h-5" />,
          description: 'Naprawa usterek i serwis niestandardowy',
          interval: 'Według potrzeb',
          estimatedDuration: 'Zależnie od zakresu'
        }
      default:
        return {
          icon: <WrenchIcon className="w-5 h-5" />,
          description: 'Serwis pojazdu',
          interval: 'Zgodnie z harmonogramem',
          estimatedDuration: 'Do ustalenia'
        }
    }
  }

  const serviceInfo = getServiceTypeInfo()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {serviceInfo.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Planowanie serwisu
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

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-center space-x-8">
            {[
              { key: 'details', label: 'Szczegóły', icon: CalendarDaysIcon },
              { key: 'provider', label: 'Serwisant', icon: UserIcon },
              { key: 'confirmation', label: 'Potwierdzenie', icon: CheckCircleIcon }
            ].map((stepItem, index) => (
              <div key={stepItem.key} className="flex items-center">
                <div className={`flex items-center gap-2 ${
                  step === stepItem.key 
                    ? 'text-blue-600' 
                    : index < ['details', 'provider', 'confirmation'].indexOf(step)
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === stepItem.key
                      ? 'bg-blue-100'
                      : index < ['details', 'provider', 'confirmation'].indexOf(step)
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                  }`}>
                    <stepItem.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{stepItem.label}</span>
                </div>
                {index < 2 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    index < ['details', 'provider', 'confirmation'].indexOf(step)
                      ? 'bg-green-300'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Service Details */}
          {step === 'details' && (
            <div className="space-y-6">
              {/* Service Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {translateServiceTypeEnhanced(serviceType)}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {serviceInfo.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Interwał serwisowy:</span>
                    <p className="font-medium text-gray-900">{serviceInfo.interval}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Szacowany czas:</span>
                    <p className="font-medium text-gray-900">{serviceInfo.estimatedDuration}</p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data serwisu
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      scheduledDate: new Date(e.target.value)
                    }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.scheduledDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.scheduledDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferowana godzina
                  </label>
                  <select
                    value={formData.preferredTime || '09:00'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferredTime: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                  </select>
                  {errors.preferredTime && (
                    <p className="text-red-600 text-sm mt-1">{errors.preferredTime}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Szacowany koszt (PLN)
                  </label>
                  <Input
                    type="number"
                    value={formData.estimatedCost || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      estimatedCost: Number(e.target.value)
                    }))}
                    placeholder="0"
                    className="w-full"
                  />
                  {errors.estimatedCost && (
                    <p className="text-red-600 text-sm mt-1">{errors.estimatedCost}</p>
                  )}
                </div>

                {serviceType !== 'REPAIR' && serviceType !== 'TECHNICAL_INSPECTION' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interwał powtarzania (km)
                    </label>
                    <Input
                      type="number"
                      value={formData.recurringInterval || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurringInterval: Number(e.target.value)
                      }))}
                      placeholder="5000"
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Recurring Service */}
              {serviceType !== 'REPAIR' && serviceType !== 'TECHNICAL_INSPECTION' && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formData.isRecurring || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isRecurring: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isRecurring" className="text-sm text-gray-700">
                    Ustaw jako serwis cykliczny (automatyczne przypomnienia)
                  </label>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dodatkowe uwagi
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  rows={3}
                  placeholder="Dodatkowe informacje dla serwisanta..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 2: Provider Selection */}
          {step === 'provider' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Wybierz serwisant
              </h3>
              
              {availableProviders.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Brak dostępnych serwisów
                  </h4>
                  <p className="text-gray-600">
                    Nie znaleziono serwisów obsługujących ten typ usługi dla tego pojazdu.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableProviders.map((provider) => {
                    const servicePrice = provider.priceList.find(p => p.serviceType === serviceType)
                    const isSelected = selectedProvider?.id === provider.id
                    
                    return (
                      <div
                        key={provider.id}
                        onClick={() => handleProviderSelect(provider)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              {'★'.repeat(Math.floor(provider.averageRating))}
                              <span className="text-sm text-gray-600 ml-1">
                                ({provider.averageRating})
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                          )}
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{provider.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4" />
                            <span>{provider.phone}</span>
                          </div>
                          {servicePrice && (
                            <div className="flex items-center gap-2">
                              <DollarSignIcon className="w-4 h-4" />
                              <span>
                                Średni koszt: {servicePrice.averageCost.toLocaleString('pl-PL', {
                                  style: 'currency',
                                  currency: 'PLN',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1 mt-3">
                          {provider.specialties.map((specialty) => (
                            <Badge
                              key={specialty}
                              variant="neutral"
                              size="sm"
                              className="text-xs"
                            >
                              {translateServiceTypeEnhanced(specialty)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              
              {errors.serviceProviderId && (
                <p className="text-red-600 text-sm">{errors.serviceProviderId}</p>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Potwierdzenie planowania serwisu
              </h3>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vehicle & Service Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Pojazd i serwis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pojazd:</span>
                        <span className="font-medium">
                          {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Typ serwisu:</span>
                        <span className="font-medium">
                          {translateServiceTypeEnhanced(serviceType)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data:</span>
                        <span className="font-medium">
                          {formData.scheduledDate?.toLocaleDateString('pl-PL')} o {formData.preferredTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Szacowany koszt:</span>
                        <span className="font-medium">
                          {(formData.estimatedCost || 0).toLocaleString('pl-PL', {
                            style: 'currency',
                            currency: 'PLN',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Provider Info */}
                  {selectedProvider && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Serwisant</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nazwa:</span>
                          <span className="font-medium">{selectedProvider.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ocena:</span>
                          <span className="font-medium">
                            ★ {selectedProvider.averageRating}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Telefon:</span>
                          <span className="font-medium">{selectedProvider.phone}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Adres:</span>
                          <p className="font-medium text-right text-xs leading-tight">
                            {selectedProvider.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Options */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Dodatkowe opcje</h4>
                  <div className="space-y-2 text-sm">
                    {formData.isRecurring && (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Serwis cykliczny (co {formData.recurringInterval} km)</span>
                      </div>
                    )}
                    {formData.notes && (
                      <div>
                        <span className="text-gray-600">Uwagi:</span>
                        <p className="text-gray-900 mt-1 p-3 bg-white rounded border text-xs">
                          {formData.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">
                      Potwierdź planowanie serwisu
                    </p>
                    <p className="text-yellow-700">
                      Po potwierdzeniu zostanie utworzone przypomnienie serwisowe. 
                      Skontaktuj się z serwisantem aby ostatecznie potwierdzić termin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            {step !== 'details' && (
              <Button
                variant="outline"
                onClick={() => {
                  if (step === 'provider') setStep('details')
                  if (step === 'confirmation') setStep('provider')
                }}
                disabled={loading}
              >
                Wstecz
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Anuluj
            </Button>
            {step === 'details' && (
              <Button
                onClick={() => setStep('provider')}
                disabled={!formData.scheduledDate || !formData.estimatedCost}
              >
                Dalej
              </Button>
            )}
            {step === 'provider' && (
              <Button
                onClick={() => setStep('confirmation')}
                disabled={!selectedProvider}
              >
                Dalej
              </Button>
            )}
            {step === 'confirmation' && (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Planowanie...
                  </>
                ) : (
                  <>
                    <CalendarDaysIcon className="w-4 h-4" />
                    Zaplanuj serwis
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceSchedulingModal