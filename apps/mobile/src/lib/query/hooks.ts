import { useMutation, useQuery, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import { apiClient } from '../api/http-client';
import { queryClient } from './query-client';

/**
 * Enhanced query hook with offline support
 */
export function useOfflineQuery<TData = unknown, TError = unknown>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  const netInfo = useNetInfo();
  
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...options,
    
    // Show cached data when offline
    placeholderData: (previousData) => previousData,
    
    // Add network status to meta
    meta: {
      ...options?.meta,
      isOffline: !netInfo.isConnected,
      connectionType: netInfo.type,
    },
    
    // Handle network-specific behavior
    enabled: options?.enabled ?? true,
    networkMode: 'offlineFirst',
    
    // Optimize for offline scenarios
    staleTime: options?.staleTime ?? (netInfo.isConnected ? 1000 * 60 * 5 : Infinity),
    cacheTime: options?.cacheTime ?? 1000 * 60 * 60 * 24, // 24 hours
    
    onError: (error) => {
      console.error(`Query error for ${queryKey.join('.')}:`, error);
      options?.onError?.(error);
    },
  });
}

/**
 * Enhanced mutation hook with offline queueing
 */
export function useOfflineMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> & {
    optimisticResponse?: (variables: TVariables) => TData;
    operationType?: 'CREATE' | 'UPDATE' | 'DELETE';
    entityType?: string;
    syncPriority?: 'high' | 'medium' | 'low';
  }
) {
  const netInfo = useNetInfo();
  
  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn: async (variables: TVariables) => {
      // If offline, queue for sync and return optimistic response
      if (!netInfo.isConnected) {
        // Queue mutation for sync when back online
        const { syncQueue } = await import('../sync/sync-queue');
        
        await syncQueue.add({
          type: options?.operationType || 'UPDATE',
          entity: options?.entityType || 'unknown',
          payload: variables,
          timestamp: Date.now(),
          priority: options?.syncPriority || 'medium',
        });
        
        // Return optimistic response if provided
        if (options?.optimisticResponse) {
          return options.optimisticResponse(variables);
        }
        
        // Otherwise return variables as response
        return variables as unknown as TData;
      }
      
      // Online - execute mutation normally
      return mutationFn(variables);
    },
    
    ...options,
    
    networkMode: 'offlineFirst',
    
    onMutate: async (variables) => {
      // Optimistic updates for better UX
      if (options?.optimisticResponse) {
        const optimisticData = options.optimisticResponse(variables);
        
        // Update relevant queries optimistically
        if (options?.entityType) {
          queryClient.setQueryData([options.entityType], (oldData: any) => {
            if (Array.isArray(oldData)) {
              // Handle array data (e.g., list of items)
              return [...oldData, optimisticData];
            }
            // Handle single item data
            return optimisticData;
          });
        }
      }
      
      return options?.onMutate?.(variables);
    },
    
    onError: async (error: TError, variables: TVariables, context) => {
      // Handle network errors by queueing for retry
      if ((error as any)?.isNetworkError || (error as any)?.code === 'NETWORK_ERROR') {
        const { syncQueue } = await import('../sync/sync-queue');
        
        await syncQueue.add({
          type: options?.operationType || 'UPDATE',
          entity: options?.entityType || 'unknown',
          payload: variables,
          timestamp: Date.now(),
          priority: options?.syncPriority || 'medium',
          retryCount: 1,
        });
        
        // Don't propagate network errors to UI if queued successfully
        return;
      }
      
      // Revert optimistic updates on error
      if (options?.entityType) {
        queryClient.invalidateQueries({ queryKey: [options.entityType] });
      }
      
      options?.onError?.(error, variables, context);
    },
    
    onSuccess: (data, variables, context) => {
      // Invalidate and refetch related queries
      if (options?.entityType) {
        queryClient.invalidateQueries({ queryKey: [options.entityType] });
      }
      
      options?.onSuccess?.(data, variables, context);
    },
  });
}

/**
 * Hook for attendance check-in/out with offline support
 */
export function useAttendanceMutation() {
  return useOfflineMutation(
    async (data: { type: 'check-in' | 'check-out'; projectId: string; location?: { lat: number; lng: number } }) => {
      return apiClient.post('/api/attendance', data);
    },
    {
      operationType: 'CREATE',
      entityType: 'attendance',
      syncPriority: 'high',
      optimisticResponse: (variables) => ({
        id: `temp-${Date.now()}`,
        ...variables,
        timestamp: new Date().toISOString(),
        synced: false,
      }),
    }
  );
}

/**
 * Hook for task updates with offline support
 */
export function useTaskUpdateMutation() {
  return useOfflineMutation(
    async (data: { taskId: string; status?: string; notes?: string; progress?: number }) => {
      return apiClient.patch(`/api/tasks/${data.taskId}`, data);
    },
    {
      operationType: 'UPDATE',
      entityType: 'tasks',
      syncPriority: 'high',
      optimisticResponse: (variables) => ({
        ...variables,
        updatedAt: new Date().toISOString(),
        synced: false,
      }),
    }
  );
}

/**
 * Hook for material requests with offline support
 */
export function useMaterialRequestMutation() {
  return useOfflineMutation(
    async (data: { projectId: string; materials: Array<{ materialId: string; quantity: number }> }) => {
      return apiClient.post('/api/material-requests', data);
    },
    {
      operationType: 'CREATE',
      entityType: 'material-requests',
      syncPriority: 'medium',
      optimisticResponse: (variables) => ({
        id: `temp-${Date.now()}`,
        ...variables,
        status: 'pending',
        createdAt: new Date().toISOString(),
        synced: false,
      }),
    }
  );
}

/**
 * Hook for user data with offline caching
 */
export function useUser() {
  return useOfflineQuery(
    ['user'],
    () => apiClient.get('/api/auth/me'),
    {
      staleTime: 1000 * 60 * 30, // 30 minutes
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    }
  );
}

/**
 * Hook for projects with offline caching
 */
export function useProjects() {
  return useOfflineQuery(
    ['projects'],
    () => apiClient.get('/api/projects'),
    {
      staleTime: 1000 * 60 * 15, // 15 minutes
      cacheTime: 1000 * 60 * 60 * 12, // 12 hours
    }
  );
}

/**
 * Hook for project details with offline caching
 */
export function useProject(projectId: string) {
  return useOfflineQuery(
    ['projects', projectId],
    () => apiClient.get(`/api/projects/${projectId}`),
    {
      enabled: !!projectId,
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 60 * 6, // 6 hours
    }
  );
}

/**
 * Hook for tasks with offline caching
 */
export function useTasks(projectId?: string) {
  return useOfflineQuery(
    ['tasks', projectId],
    () => apiClient.get(`/api/tasks${projectId ? `?projectId=${projectId}` : ''}`),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60 * 4, // 4 hours
    }
  );
}

/**
 * Hook for attendance records with offline caching
 */
export function useAttendance(userId?: string, projectId?: string) {
  return useOfflineQuery(
    ['attendance', userId, projectId],
    () => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (projectId) params.append('projectId', projectId);
      return apiClient.get(`/api/attendance?${params.toString()}`);
    },
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 60 * 8, // 8 hours
    }
  );
}

/**
 * Hook for materials with offline caching
 */
export function useMaterials() {
  return useOfflineQuery(
    ['materials'],
    () => apiClient.get('/api/materials'),
    {
      staleTime: 1000 * 60 * 60, // 1 hour (materials don't change often)
      cacheTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    }
  );
}

/**
 * Hook for notifications with offline caching
 */
export function useNotifications() {
  return useOfflineQuery(
    ['notifications'],
    () => apiClient.get('/api/notifications'),
    {
      staleTime: 1000 * 60 * 2, // 2 minutes
      cacheTime: 1000 * 60 * 60 * 2, // 2 hours
    }
  );
}

/**
 * Hook for sync queue status
 */
export function useSyncStatus() {
  const netInfo = useNetInfo();
  
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const { syncQueue } = await import('../sync/sync-queue');
      return {
        pendingCount: syncQueue.getPendingCount(),
        failedCount: syncQueue.getFailedItems().length,
        isOnline: netInfo.isConnected,
        lastSyncAttempt: syncQueue.getLastSyncAttempt(),
      };
    },
    refetchInterval: 5000, // Update every 5 seconds
    networkMode: 'always', // Always run, even offline
  });
}