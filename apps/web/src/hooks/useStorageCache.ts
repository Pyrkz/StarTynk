import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createWebStorage } from '@repo/shared/storage'

/**
 * Example of using unified storage as a persistent cache for React Query
 * This enables offline support and faster app startup
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

/**
 * Create a persistent cache storage for React Query
 */
export function createPersistentCache<T>(key: string, ttl: number = 1000 * 60 * 60) {
  const storage = createWebStorage<CacheEntry<T> | null>({
    key: `cache_${key}`,
    defaultValue: null,
  })

  return {
    get: async (): Promise<T | null> => {
      const entry = await storage.getAsync()
      
      if (!entry) return null
      
      // Check if cache is expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        await storage.clear()
        return null
      }
      
      return entry.data
    },
    
    set: async (data: T): Promise<void> => {
      await storage.set({
        data,
        timestamp: Date.now(),
        ttl,
      })
    },
    
    clear: () => storage.clear(),
  }
}

/**
 * Custom hook that combines React Query with persistent storage
 */
export function usePersistedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    ttl?: number
    staleTime?: number
    refetchOnMount?: boolean
  }
) {
  const cache = createPersistentCache<T>(queryKey.join('_'), options?.ttl)
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Try to get from persistent cache first
      const cached = await cache.get()
      if (cached) {
        return cached
      }
      
      // Fetch fresh data
      const data = await queryFn()
      
      // Save to persistent cache
      await cache.set(data)
      
      return data
    },
    staleTime: options?.staleTime || 1000 * 60 * 5, // 5 minutes
    refetchOnMount: options?.refetchOnMount ?? true,
    // Initialize with cached data while fetching
    placeholderData: async () => {
      const cached = await cache.get()
      return cached || undefined
    },
  })
}

/**
 * Example: User profile with persistent caching
 */
interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  createdAt: string
}

export function useUserProfile(userId: string) {
  return usePersistedQuery(
    ['user', userId],
    async () => {
      const response = await fetch(`/api/users/${userId}`)
      if (!response.ok) throw new Error('Failed to fetch user')
      return response.json() as Promise<UserProfile>
    },
    {
      ttl: 1000 * 60 * 30, // Cache for 30 minutes
      staleTime: 1000 * 60 * 5, // Consider stale after 5 minutes
    }
  )
}

/**
 * Example: Optimistic updates with persistent storage
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  const storage = createWebStorage<UserProfile>({
    key: 'current_user_profile',
    defaultValue: {} as UserProfile,
  })

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) throw new Error('Failed to update profile')
      return response.json() as Promise<UserProfile>
    },
    
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user', 'me'] })
      
      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<UserProfile>(['user', 'me'])
      
      // Optimistically update
      if (previousProfile) {
        const optimisticProfile = { ...previousProfile, ...updates }
        queryClient.setQueryData(['user', 'me'], optimisticProfile)
        
        // Also update persistent storage
        await storage.set(optimisticProfile)
      }
      
      return { previousProfile }
    },
    
    onError: async (err, updates, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(['user', 'me'], context.previousProfile)
        await storage.set(context.previousProfile)
      }
    },
    
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })
}

/**
 * Example: Sync storage with React Query cache
 */
export function useSyncedStorage<T>(
  key: string,
  defaultValue: T,
  queryKey?: string[]
) {
  const queryClient = useQueryClient()
  const storage = createWebStorage<T>({ key, defaultValue })
  
  const { data, isLoading } = useQuery({
    queryKey: queryKey || [key],
    queryFn: () => storage.getAsync(),
    staleTime: Infinity, // Never stale since we control updates
  })
  
  const update = useMutation({
    mutationFn: async (newValue: T) => {
      await storage.set(newValue)
      return newValue
    },
    onSuccess: (newValue) => {
      queryClient.setQueryData(queryKey || [key], newValue)
    },
  })
  
  return {
    data: data ?? defaultValue,
    isLoading,
    update: update.mutate,
    updateAsync: update.mutateAsync,
  }
}