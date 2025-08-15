import { useState, useEffect, useCallback } from 'react'
import { ProjectDetailWithRelations, ProjectDetailMetrics, ApartmentListItem } from '../types'

interface UseProjectDetailResult {
  project: ProjectDetailWithRelations | null
  metrics: ProjectDetailMetrics | null
  apartments: ApartmentListItem[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateProject: (data: Partial<ProjectDetailWithRelations>) => Promise<void>
}

interface ProjectDetailResponse extends Omit<ProjectDetailWithRelations, 'apartments'> {
  apartments: ApartmentListItem[]
  metrics: ProjectDetailMetrics
}

export function useProjectDetail(projectId: string): UseProjectDetailResult {
  const [project, setProject] = useState<ProjectDetailWithRelations | null>(null)
  const [metrics, setMetrics] = useState<ProjectDetailMetrics | null>(null)
  const [apartments, setApartments] = useState<ApartmentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjectDetail = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/detail`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Projekt nie został znaleziony')
        }
        if (response.status === 401) {
          throw new Error('Brak uprawnień do wyświetlenia tego projektu')
        }
        throw new Error('Wystąpił błąd podczas pobierania danych projektu')
      }

      const data: ProjectDetailResponse = await response.json()
      
      // Transform the response to match our expected types
      const transformedProject: ProjectDetailWithRelations = {
        ...data,
        apartments: data.apartments.map(apartment => ({
          id: apartment.id,
          projectId: data.id, // Use the project ID from data
          number: apartment.number,
          floor: apartment.floor,
          area: apartment.area,
          rooms: null, // Add missing field
          type: null, // Add missing field
          isActive: true, // Add missing field
          createdAt: new Date(), // Add missing field
          updatedAt: new Date(), // Add missing field
          deletedAt: null, // Add missing field
          tasks: [], // We don't need full task data in the main project object
          _count: {
            tasks: apartment.totalTasks,
            completedTasks: apartment.tasksCompleted
          }
        }))
      }

      setProject(transformedProject)
      setMetrics(data.metrics)
      setApartments(data.apartments)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd'
      setError(errorMessage)
      console.error('Error fetching project detail:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const updateProject = useCallback(async (updateData: Partial<ProjectDetailWithRelations>) => {
    if (!projectId) return

    try {
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/detail`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Projekt nie został znaleziony')
        }
        if (response.status === 401) {
          throw new Error('Brak uprawnień do edycji tego projektu')
        }
        throw new Error('Wystąpił błąd podczas aktualizacji projektu')
      }

      // Refetch the project data to ensure consistency
      await fetchProjectDetail()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd'
      setError(errorMessage)
      console.error('Error updating project:', err)
      throw err // Re-throw to allow component to handle the error
    }
  }, [projectId, fetchProjectDetail])

  useEffect(() => {
    fetchProjectDetail()
  }, [fetchProjectDetail])

  return {
    project,
    metrics,
    apartments,
    loading,
    error,
    refetch: fetchProjectDetail,
    updateProject
  }
}

// Helper hook for apartment filtering and searching
export function useApartmentFilters(apartments: ApartmentListItem[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredApartments = apartments.filter(apartment => {
    const matchesSearch = 
      apartment.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apartment.assignedUser?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ''

    const matchesStatus = statusFilter === 'all' || apartment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const statusCounts = apartments.reduce((acc, apartment) => {
    acc[apartment.status] = (acc[apartment.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredApartments,
    statusCounts,
    totalApartments: apartments.length
  }
}