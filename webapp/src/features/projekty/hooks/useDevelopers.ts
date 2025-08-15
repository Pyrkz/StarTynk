import { useState, useEffect } from 'react'

interface Developer {
  id: string
  name: string
  address?: string | null
  email?: string | null
  phone?: string | null
  _count?: {
    projects: number
  }
}

interface UseDevelopersReturn {
  developers: Developer[]
  loading: boolean
  error: string | null
}

export function useDevelopers(): UseDevelopersReturn {
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/developers')
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Błąd pobierania deweloperów')
        }

        const data = await response.json()
        setDevelopers(data.developers)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd')
        setDevelopers([])
      } finally {
        setLoading(false)
      }
    }

    fetchDevelopers()
  }, [])

  return {
    developers,
    loading,
    error,
  }
}