import { useState, useEffect, useCallback } from 'react'
import { createWebStorage } from '@repo/shared/storage'
import { HEADER_CONSTANTS } from '../lib/constants'
import { generateId } from '../lib/utils'
import type { RecentSearch } from '../types'

// Create a storage instance for recent searches
const recentSearchesStorage = createWebStorage<RecentSearch[]>({
  key: HEADER_CONSTANTS.STORAGE.RECENT_SEARCHES,
  defaultValue: [],
  // Custom deserializer to convert timestamp strings back to Date objects
  deserialize: (value: string) => {
    const searches = JSON.parse(value)
    return searches.map((s: any) => ({
      ...s,
      timestamp: new Date(s.timestamp)
    }))
  }
})

/**
 * Custom hook for managing recent searches with unified storage
 */
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load recent searches on mount
  useEffect(() => {
    const loadSearches = async () => {
      try {
        const searches = await recentSearchesStorage.getAsync()
        setRecentSearches(searches)
      } catch (error) {
        console.error('Failed to load recent searches:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSearches()

    // Subscribe to storage changes (useful for cross-tab synchronization)
    const unsubscribe = recentSearchesStorage.subscribe((searches) => {
      setRecentSearches(searches)
    })

    return unsubscribe
  }, [])

  // Add a new search
  const addSearch = useCallback(async (query: string, resultsCount: number = 0) => {
    if (!query.trim()) return

    const newSearch: RecentSearch = {
      id: generateId(),
      query: query.trim(),
      timestamp: new Date(),
      resultsCount,
    }

    const updated = [
      newSearch,
      ...recentSearches.filter(s => s.query !== query.trim())
    ].slice(0, HEADER_CONSTANTS.LIMITS.MAX_RECENT_SEARCHES)

    setRecentSearches(updated)
    
    try {
      await recentSearchesStorage.set(updated)
    } catch (error) {
      console.error('Failed to save recent search:', error)
    }
  }, [recentSearches])

  // Remove a search
  const removeSearch = useCallback(async (id: string) => {
    const updated = recentSearches.filter(s => s.id !== id)
    setRecentSearches(updated)
    
    try {
      await recentSearchesStorage.set(updated)
    } catch (error) {
      console.error('Failed to remove search:', error)
    }
  }, [recentSearches])

  // Clear all searches
  const clearSearches = useCallback(async () => {
    setRecentSearches([])
    
    try {
      await recentSearchesStorage.clear()
    } catch (error) {
      console.error('Failed to clear searches:', error)
    }
  }, [])

  return {
    recentSearches,
    isLoading,
    addSearch,
    removeSearch,
    clearSearches,
  }
}