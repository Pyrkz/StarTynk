import { useState, useEffect } from 'react'

interface Coordinator {
  id: string
  name?: string | null
  email: string
  role: string
  _count?: {
    coordinatedProjects: number
  }
}

interface UseCoordinatorsReturn {
  coordinators: Coordinator[]
  loading: boolean
  error: string | null
}

export function useCoordinators(): UseCoordinatorsReturn {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/users/coordinators')
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Błąd pobierania koordynatorów')
        }

        const data = await response.json()
        setCoordinators(data.coordinators)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd')
        setCoordinators([])
      } finally {
        setLoading(false)
      }
    }

    fetchCoordinators()
  }, [])

  return {
    coordinators,
    loading,
    error,
  }
}