import { useState, useEffect } from 'react'
// import { useSession } from 'next-auth/react' // Temporarily disabled for client demo
import { useSession } from '@/lib/mock-auth'

export interface ProjectEmployee {
  id: string
  name: string
  position: string
  department: string
  email: string
  phone: string
  avatar?: string
  status: 'active' | 'on_leave' | 'inactive'
  joinedDate: Date
  tasksAssigned: number
  tasksCompleted: number
  equipmentAssigned: {
    id: string
    name: string
    type: 'tool' | 'vehicle' | 'safety' | 'other'
    serialNumber?: string
    condition: 'excellent' | 'good' | 'fair' | 'poor'
    assignedDate: Date
  }[]
  currentApartments: string[]
  role?: string
  hourlyRate?: number
  employmentType?: string
}

export function useProjectEmployees(projectId: string) {
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<ProjectEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session || !projectId) return

    const fetchEmployees = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/${projectId}/employees`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch project employees')
        }

        const data = await response.json()
        
        // Transform dates
        const transformedData = data.map((employee: any) => ({
          ...employee,
          joinedDate: new Date(employee.joinedDate),
          equipmentAssigned: employee.equipmentAssigned.map((eq: any) => ({
            ...eq,
            assignedDate: new Date(eq.assignedDate)
          }))
        }))
        
        setEmployees(transformedData)
        setError(null)
      } catch (err) {
        console.error('Error fetching project employees:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [projectId, session])

  const assignEmployee = async (userId: string, role?: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign employee')
      }

      // Refresh employees list
      const updatedResponse = await fetch(`/api/projects/${projectId}/employees`)
      const data = await updatedResponse.json()
      setEmployees(data)
      
      return { success: true }
    } catch (err) {
      console.error('Error assigning employee:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to assign employee' 
      }
    }
  }

  const removeEmployee = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/employees?userId=${userId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to remove employee')
      }

      // Remove from local state
      setEmployees(prev => prev.filter(emp => emp.id !== userId))
      
      return { success: true }
    } catch (err) {
      console.error('Error removing employee:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to remove employee' 
      }
    }
  }

  return {
    employees,
    loading,
    error,
    refetch: () => {
      if (session && projectId) {
        const fetchEmployees = async () => {
          try {
            setLoading(true)
            const response = await fetch(`/api/projects/${projectId}/employees`)
            
            if (!response.ok) {
              throw new Error('Failed to fetch project employees')
            }

            const data = await response.json()
            
            // Transform dates
            const transformedData = data.map((employee: any) => ({
              ...employee,
              joinedDate: new Date(employee.joinedDate),
              equipmentAssigned: employee.equipmentAssigned.map((eq: any) => ({
                ...eq,
                assignedDate: new Date(eq.assignedDate)
              }))
            }))
            
            setEmployees(transformedData)
            setError(null)
          } catch (err) {
            console.error('Error fetching project employees:', err)
            setError(err instanceof Error ? err.message : 'An error occurred')
          } finally {
            setLoading(false)
          }
        }

        fetchEmployees()
      }
    },
    assignEmployee,
    removeEmployee
  }
}