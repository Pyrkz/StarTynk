'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { QualityControl } from '@/types/quality-control'

interface QualityControlAssessmentProps {
  taskId: string
}

export const QualityControlAssessment: React.FC<QualityControlAssessmentProps> = ({
  taskId
}) => {
  const router = useRouter()
  const [qualityControl, setQualityControl] = useState<QualityControl | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [comments, setComments] = useState('')
  const [selectedScore, setSelectedScore] = useState<number>(70)
  const [measurements, setMeasurements] = useState({
    reportedArea: 125.5,
    correctedArea: 125.5,
    reportedLength: 45.2,
    correctedLength: 45.2
  })

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchQualityControl = async () => {
      setIsLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock quality control data
      const mockQualityControl: QualityControl = {
        id: '1',
        taskId: 'TSK-2024-001',
        controllerId: 'ctrl-1',
        controlNumber: 1,
        status: 'PENDING',
        completionRate: 85,
        qualityScore: 0,
        reportedArea: 125.5,
        correctedArea: 125.5,
        reportedLength: 45.2,
        correctedLength: 45.2,
        notes: '',
        controlDate: new Date('2024-01-15T10:30:00'),
        isActive: true,
        createdAt: new Date('2024-01-15T10:30:00'),
        updatedAt: new Date('2024-01-15T10:30:00'),
        task: {
          id: 'TSK-2024-001',
          title: 'Glazura łazienka - Apartament 12',
          projectId: 'proj-1',
          project: {
            name: 'Osiedle Słoneczne - Budynek A'
          },
          assignments: [{
            user: {
              id: 'user-1',
              name: 'Jan Kowalski'
            }
          }]
        },
        controller: {
          id: 'ctrl-1',
          name: 'Anna Nowak'
        },
        history: [
          {
            id: 'hist-1',
            qualityControlId: '1',
            action: 'SUBMITTED',
            userId: 'user-1',
            notes: 'Zadanie przesłane do kontroli',
            actionDate: new Date('2024-01-15T10:30:00'),
            isActive: true,
            createdAt: new Date('2024-01-15T10:30:00')
          },
          {
            id: 'hist-2',
            qualityControlId: '1',
            action: 'IN_PROGRESS',
            userId: 'user-1',
            notes: 'Rozpoczęto wykonywanie prac',
            actionDate: new Date('2024-01-14T08:00:00'),
            isActive: true,
            createdAt: new Date('2024-01-14T08:00:00')
          },
          {
            id: 'hist-3',
            qualityControlId: '1',
            action: 'MATERIALS_DELIVERED',
            userId: 'user-1',
            notes: 'Dostarczono materiały na budowę',
            actionDate: new Date('2024-01-13T14:00:00'),
            isActive: true,
            createdAt: new Date('2024-01-13T14:00:00')
          }
        ]
      }

      setQualityControl(mockQualityControl)
      setIsLoading(false)
    }

    fetchQualityControl()
  }, [taskId])

  const handleCancel = () => {
    router.push('/dashboard/kontrola-jakosci')
  }

  const handleConfirm = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    console.log('Confirmed quality control')
    setIsSaving(false)
    router.push('/dashboard/kontrola-jakosci')
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!qualityControl) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">❌</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Zadanie nie znalezione</h3>
        <p className="text-gray-600">Nie można znaleźć zadania o ID: {taskId}</p>
      </div>
    )
  }

  // Mock photos
  const mockPhotos = [
    'https://via.placeholder.com/400x300/0055B8/FFFFFF?text=Zdj%C4%99cie+1',
    'https://via.placeholder.com/400x300/0055B8/FFFFFF?text=Zdj%C4%99cie+2',
    'https://via.placeholder.com/400x300/0055B8/FFFFFF?text=Zdj%C4%99cie+3',
    'https://via.placeholder.com/400x300/0055B8/FFFFFF?text=Zdj%C4%99cie+4',
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Task Details, History and Photos */}
      <div className="lg:col-span-2 space-y-6">
        {/* Task Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{qualityControl.task.title}</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">ID zadania:</span>
              <p className="font-medium">{qualityControl.task.id}</p>
            </div>
            <div>
              <span className="text-gray-600">Projekt:</span>
              <p className="font-medium">{qualityControl.task.project.name}</p>
            </div>
            <div>
              <span className="text-gray-600">Wykonawca:</span>
              <p className="font-medium">{qualityControl.task.assignments[0]?.user.name}</p>
            </div>
            <div>
              <span className="text-gray-600">Kontroler:</span>
              <p className="font-medium">{qualityControl.controller.name}</p>
            </div>
          </div>
        </div>

        {/* Task History Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historia zadania</h2>
          <div className="space-y-4">
            {qualityControl.history.map((event, index) => (
              <div key={event.id} className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    index === 0 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  )}>
                    {index === 0 ? '📋' : index === 1 ? '🔨' : '📦'}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{event.notes}</p>
                  <p className="text-sm text-gray-600">{formatDate(event.actionDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Photos Gallery */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Zdjęcia wykonanych prac</h2>
          <div className="grid grid-cols-2 gap-4">
            {mockPhotos.map((photo, index) => (
              <div key={index} className="relative group cursor-pointer">
                <img 
                  src={photo} 
                  alt={`Zdjęcie ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    🔍 Powiększ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Quality Control Form */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6 sticky top-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Kontrola jakości</h2>

          {/* Data Verification */}
          <div className="space-y-4 mb-6">
            <h3 className="font-medium text-gray-900">Weryfikacja danych</h3>
            
            <div>
              <label className="block text-sm text-gray-600 mb-2">Powierzchnia (m²)</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-gray-500">Zgłoszona</span>
                  <input
                    type="number"
                    value={measurements.reportedArea}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500">Skorygowana ✏️</span>
                  <input
                    type="number"
                    value={measurements.correctedArea}
                    onChange={(e) => setMeasurements({...measurements, correctedArea: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Edytuj"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Długość (m)</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-gray-500">Zgłoszona</span>
                  <input
                    type="number"
                    value={measurements.reportedLength}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500">Skorygowana ✏️</span>
                  <input
                    type="number"
                    value={measurements.correctedLength}
                    onChange={(e) => setMeasurements({...measurements, correctedLength: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Edytuj"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quality Score */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Ocena jakości pracy</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Jakość wykonania</span>
                <span className="font-medium">{selectedScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                value={[0, 50, 70, 100].indexOf(selectedScore)}
                onChange={(e) => {
                  const options = [0, 50, 70, 100];
                  setSelectedScore(options[parseInt(e.target.value)]);
                }}
                className="w-full"
                list="quality-options"
              />
              <datalist id="quality-options">
                <option value="0" label="0%"></option>
                <option value="1" label="50%"></option>
                <option value="2" label="70%"></option>
                <option value="3" label="100%"></option>
              </datalist>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>70%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="mb-6">
            <label className="block font-medium text-gray-900 mb-2">Komentarz</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Dodaj komentarz do kontroli..."
            />
          </div>

          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block font-medium text-gray-900 mb-2">Dodaj zdjęcia</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
              <div className="text-gray-600">
                <div className="text-3xl mb-2">📷</div>
                <p className="text-sm">Kliknij lub przeciągnij zdjęcia</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG do 5MB</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t pt-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status kontroli:</span>
                <Badge variant="warning">Oczekująca</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Postęp wykonania:</span>
                <span className="font-medium">{qualityControl.completionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ocena jakości:</span>
                <span className="font-medium text-lg">{selectedScore}%</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={handleConfirm}
              isLoading={isSaving}
              className="w-full"
            >
              Potwierdź kontrolę
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="w-full"
            >
              Anuluj
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}