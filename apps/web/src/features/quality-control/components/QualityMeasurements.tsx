'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface MeasurementsData {
  reportedArea: number
  correctedArea: number
  reportedLength: number
  correctedLength: number
}

interface QualityMeasurementsProps {
  measurements: MeasurementsData
  onChange: (measurements: MeasurementsData) => void
  disabled?: boolean
}

export const QualityMeasurements: React.FC<QualityMeasurementsProps> = ({
  measurements,
  onChange,
  disabled = false
}) => {
  const handleFieldChange = (field: keyof MeasurementsData, value: string) => {
    const numericValue = parseFloat(value) || 0
    onChange({
      ...measurements,
      [field]: numericValue
    })
  }

  const formatNumber = (value: number): string => {
    return value.toFixed(2)
  }

  const hasAreaDifference = measurements.reportedArea !== measurements.correctedArea
  const hasLengthDifference = measurements.reportedLength !== measurements.correctedLength

  const areaDifference = measurements.correctedArea - measurements.reportedArea
  const lengthDifference = measurements.correctedLength - measurements.reportedLength

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Weryfikacja danych</h3>
      
      <div className="space-y-8">
        {/* Square Meters Section */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-800 flex items-center gap-2">
            📐 Metry kwadratowe
            {hasAreaDifference && (
              <span className={cn(
                'text-sm px-2 py-1 rounded-full',
                areaDifference > 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              )}>
                {areaDifference > 0 ? '+' : ''}{formatNumber(areaDifference)} m²
              </span>
            )}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reported Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wartość zgłoszona
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={measurements.reportedArea}
                  onChange={(e) => handleFieldChange('reportedArea', e.target.value)}
                  disabled={true} // Always disabled as it's reported data
                  step="0.01"
                  className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <span className="absolute right-3 top-2 text-sm text-gray-500">
                  m²
                </span>
              </div>
            </div>

            {/* Corrected Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wartość skorygowana
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={measurements.correctedArea}
                  onChange={(e) => handleFieldChange('correctedArea', e.target.value)}
                  disabled={disabled}
                  step="0.01"
                  className={cn(
                    'w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    disabled 
                      ? 'border-gray-300 bg-gray-50 text-gray-500' 
                      : 'border-gray-300 bg-white',
                    hasAreaDifference && !disabled && 'border-orange-300 bg-orange-50'
                  )}
                />
                <span className="absolute right-3 top-2 text-sm text-gray-500">
                  m²
                </span>
              </div>
              {hasAreaDifference && !disabled && (
                <p className="text-xs text-orange-600 mt-1">
                  Różnica: {areaDifference > 0 ? '+' : ''}{formatNumber(areaDifference)} m²
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Linear Meters Section */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-800 flex items-center gap-2">
            📏 Metry liniowe
            {hasLengthDifference && (
              <span className={cn(
                'text-sm px-2 py-1 rounded-full',
                lengthDifference > 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              )}>
                {lengthDifference > 0 ? '+' : ''}{formatNumber(lengthDifference)} m
              </span>
            )}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reported Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wartość zgłoszona
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={measurements.reportedLength}
                  onChange={(e) => handleFieldChange('reportedLength', e.target.value)}
                  disabled={true} // Always disabled as it's reported data
                  step="0.01"
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <span className="absolute right-3 top-2 text-sm text-gray-500">
                  m
                </span>
              </div>
            </div>

            {/* Corrected Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wartość skorygowana
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={measurements.correctedLength}
                  onChange={(e) => handleFieldChange('correctedLength', e.target.value)}
                  disabled={disabled}
                  step="0.01"
                  className={cn(
                    'w-full px-3 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    disabled 
                      ? 'border-gray-300 bg-gray-50 text-gray-500' 
                      : 'border-gray-300 bg-white',
                    hasLengthDifference && !disabled && 'border-orange-300 bg-orange-50'
                  )}
                />
                <span className="absolute right-3 top-2 text-sm text-gray-500">
                  m
                </span>
              </div>
              {hasLengthDifference && !disabled && (
                <p className="text-xs text-orange-600 mt-1">
                  Różnica: {lengthDifference > 0 ? '+' : ''}{formatNumber(lengthDifference)} m
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Automatic Calculations Summary */}
        {(hasAreaDifference || hasLengthDifference) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-yellow-800 mb-2">
              ⚠️ Wykryto różnice w pomiarach
            </h5>
            <div className="text-sm text-yellow-700 space-y-1">
              {hasAreaDifference && (
                <p>
                  • Powierzchnia: {areaDifference > 0 ? 'zwiększona' : 'zmniejszona'} o {Math.abs(areaDifference).toFixed(2)} m²
                </p>
              )}
              {hasLengthDifference && (
                <p>
                  • Długość: {lengthDifference > 0 ? 'zwiększona' : 'zmniejszona'} o {Math.abs(lengthDifference).toFixed(2)} m
                </p>
              )}
            </div>
            <p className="text-xs text-yellow-600 mt-2">
              Korekty wpłyną na automatyczne przeliczenia płatności.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}