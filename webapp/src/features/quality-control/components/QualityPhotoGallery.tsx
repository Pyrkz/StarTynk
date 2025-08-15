'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
// import { cn } from '@/lib/utils'
import type { QualityPhoto, PhotoType } from '@/types/quality-control'

interface QualityPhotoGalleryProps {
  taskId: string
  disabled?: boolean
}

interface PhotoGroup {
  type: PhotoType
  label: string
  photos: QualityPhoto[]
  icon: string
}

export const QualityPhotoGallery: React.FC<QualityPhotoGalleryProps> = ({
  taskId,
  disabled = false
}) => {
  const [photos, setPhotos] = useState<QualityPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<QualityPhoto | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchPhotos = async () => {
      setIsLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Mock photo data
      const mockPhotos: QualityPhoto[] = [
        {
          id: 'photo-1',
          url: '/api/placeholder/600/400?text=Before+Photo+1',
          description: 'Stan początkowy - widok ogólny',
          type: 'BEFORE',
          entityType: 'task',
          entityId: taskId,
          isActive: true,
          createdAt: new Date('2024-01-15T09:00:00'),
          updatedAt: new Date('2024-01-15T09:00:00')
        },
        {
          id: 'photo-2',
          url: '/api/placeholder/600/400?text=Before+Photo+2',
          description: 'Stan początkowy - detal narożnika',
          type: 'BEFORE',
          entityType: 'task',
          entityId: taskId,
          isActive: true,
          createdAt: new Date('2024-01-15T09:05:00'),
          updatedAt: new Date('2024-01-15T09:05:00')
        },
        {
          id: 'photo-3',
          url: '/api/placeholder/600/400?text=After+Photo+1',
          description: 'Stan po wykonaniu - widok ogólny',
          type: 'AFTER',
          entityType: 'task',
          entityId: taskId,
          isActive: true,
          createdAt: new Date('2024-01-15T16:30:00'),
          updatedAt: new Date('2024-01-15T16:30:00')
        },
        {
          id: 'photo-4',
          url: '/api/placeholder/600/400?text=After+Photo+2',
          description: 'Stan po wykonaniu - wykończenie narożników',
          type: 'AFTER',
          entityType: 'task',
          entityId: taskId,
          isActive: true,
          createdAt: new Date('2024-01-15T16:35:00'),
          updatedAt: new Date('2024-01-15T16:35:00')
        },
        {
          id: 'photo-5',
          url: '/api/placeholder/600/400?text=Issue+Photo',
          description: 'Widoczne nierówności powierzchni',
          type: 'ISSUE',
          entityType: 'task',
          entityId: taskId,
          isActive: true,
          createdAt: new Date('2024-01-15T17:00:00'),
          updatedAt: new Date('2024-01-15T17:00:00')
        }
      ]
      
      setPhotos(mockPhotos)
      setIsLoading(false)
    }

    fetchPhotos()
  }, [taskId])

  const groupPhotosByType = (): PhotoGroup[] => {
    const groups: PhotoGroup[] = [
      { type: 'BEFORE', label: 'Przed wykonaniem', photos: [], icon: '📷' },
      { type: 'AFTER', label: 'Po wykonaniu', photos: [], icon: '✅' },
      { type: 'ISSUE', label: 'Problemy', photos: [], icon: '⚠️' },
      { type: 'DOCUMENTATION', label: 'Dokumentacja', photos: [], icon: '📋' }
    ]

    photos.forEach(photo => {
      const group = groups.find(g => g.type === photo.type)
      if (group) {
        group.photos.push(photo)
      }
    })

    return groups.filter(group => group.photos.length > 0)
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

  const openPhotoModal = (photo: QualityPhoto) => {
    setSelectedPhoto(photo)
    setIsModalOpen(true)
  }

  const closePhotoModal = () => {
    setSelectedPhoto(null)
    setIsModalOpen(false)
  }

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return
    
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id)
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    
    if (newIndex >= photos.length) newIndex = 0
    if (newIndex < 0) newIndex = photos.length - 1
    
    setSelectedPhoto(photos[newIndex])
  }

  const photoGroups = groupPhotosByType()

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Dokumentacja fotograficzna</h3>
          {!disabled && (
            <Button variant="outline" size="sm">
              + Dodaj zdjęcia
            </Button>
          )}
        </div>

        {photoGroups.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📷</div>
            <p className="text-gray-600">Brak zdjęć dla tego zadania</p>
          </div>
        ) : (
          <div className="space-y-6">
            {photoGroups.map(group => (
              <div key={group.type}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{group.icon}</span>
                  <h4 className="font-medium text-gray-900">{group.label}</h4>
                  <Badge variant="neutral" size="sm">
                    {group.photos.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {group.photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer"
                      onClick={() => openPhotoModal(photo)}
                    >
                      <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                        <img
                          src={photo.url}
                          alt={photo.description || 'Zdjęcie zadania'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      
                      {/* Photo overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                        <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Photo index */}
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}/{group.photos.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {isModalOpen && selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          <div className="relative max-w-4xl max-h-full p-4">
            {/* Close button */}
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => navigatePhoto('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigatePhoto('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Photo */}
            <div className="text-center">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.description || 'Zdjęcie zadania'}
                className="max-w-full max-h-[80vh] object-contain"
              />
              
              {/* Photo info */}
              <div className="bg-white rounded-lg p-4 mt-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="neutral">{selectedPhoto.type}</Badge>
                  <span className="text-sm text-gray-600">
                    {formatDate(selectedPhoto.createdAt)}
                  </span>
                </div>
                {selectedPhoto.description && (
                  <p className="text-gray-700">{selectedPhoto.description}</p>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {photos.findIndex(p => p.id === selectedPhoto.id) + 1} z {photos.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}