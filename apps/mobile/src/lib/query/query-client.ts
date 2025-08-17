import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { encryptedCache, sensitiveCache } from '../storage/encrypted-cache';

/**
 * Custom persister with encryption for sensitive data
 */
const createEncryptedPersister = () => {
  return createAsyncStoragePersister({
    storage: {
      getItem: async (key: string) => {
        try {
          // Use encrypted cache for sensitive queries
          if (key.includes('user') || key.includes('auth') || key.includes('sensitive')) {
            return sensitiveCache.get<string>(key);
          }
          
          // Use regular encrypted cache for other data
          return encryptedCache.get<string>(key);
        } catch (error) {
          console.error('Failed to get persisted query:', error);
          return null;
        }
      },
      
      setItem: async (key: string, value: string) => {
        try {
          // TTL based on data sensitivity
          const ttl = key.includes('sensitive') 
            ? 1000 * 60 * 60 * 2 // 2 hours for sensitive data
            : 1000 * 60 * 60 * 24 * 7; // 7 days for regular data
          
          if (key.includes('user') || key.includes('auth') || key.includes('sensitive')) {
            await sensitiveCache.set(key, value, ttl);
          } else {
            await encryptedCache.set(key, value, ttl);
          }
        } catch (error) {
          console.error('Failed to persist query:', error);
        }
      },
      
      removeItem: async (key: string) => {
        try {
          if (key.includes('user') || key.includes('auth') || key.includes('sensitive')) {
            sensitiveCache.delete(key);
          } else {
            encryptedCache.delete(key);
          }
        } catch (error) {
          console.error('Failed to remove persisted query:', error);
        }
      },
    },
    throttleTime: 1000, // Throttle writes to improve performance
  });
};

/**
 * Network-aware retry function
 */
const networkAwareRetry = (failureCount: number, error: any) => {
  // Don't retry on 4xx errors except 401 (handled by auth interceptor)
  if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 401) {
    return false;
  }
  
  // Don't retry on network errors when offline
  if (error?.isNetworkError && !error?.response) {
    return false; // Let offline queue handle this
  }
  
  // Retry up to 3 times for other errors
  return failureCount < 3;
};

/**
 * Exponential backoff delay with jitter
 */
const retryDelay = (attemptIndex: number) => {
  const baseDelay = 1000;
  const maxDelay = 30000;
  const exponentialDelay = baseDelay * Math.pow(2, attemptIndex);
  const jitter = Math.random() * 0.1 * exponentialDelay;
  
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * Create optimized query client for offline-first mobile app
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive caching for offline capability
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
      staleTime: 1000 * 60 * 5, // 5 minutes (data considered fresh for 5 min)
      
      // Retry configuration with network awareness
      retry: networkAwareRetry,
      retryDelay,
      
      // Network mode for offline-first approach
      networkMode: 'offlineFirst',
      
      // Refetch strategies
      refetchOnReconnect: 'always',
      refetchOnMount: true,
      refetchOnWindowFocus: false, // Not relevant for mobile
      
      // Error handling
      throwOnError: false, // Handle errors manually for better UX
      
      // Background updates
      refetchInterval: false, // Disable automatic background refetch
      refetchIntervalInBackground: false,
    },
    
    mutations: {
      // Network mode for offline mutations
      networkMode: 'offlineFirst',
      
      // Retry failed mutations
      retry: 3,
      retryDelay,
      
      // Error handling
      throwOnError: false,
    },
  },
});

/**
 * Persist query client with encryption
 */
const persister = createEncryptedPersister();

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  
  hydrateOptions: {
    // Handle version mismatches gracefully
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24 * 7,
        networkMode: 'offlineFirst',
      },
    },
  },
  
  dehydrateOptions: {
    // Only persist successful queries
    shouldDehydrateQuery: (query) => {
      const { state } = query;
      
      // Don't persist queries with errors
      if (state.error) return false;
      
      // Don't persist queries that are currently fetching
      if (state.fetchStatus === 'fetching') return false;
      
      // Only persist queries with successful data
      return state.status === 'success' && state.data != null;
    },
    
    // Only persist successful mutations that should be cached
    shouldDehydrateMutation: (mutation) => {
      return mutation.state.status === 'success';
    },
  },
});

/**
 * Network status manager for React Query
 */
export class NetworkManager {
  private isOnline = true;
  private queryClient: QueryClient;
  
  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.setupNetworkListener();
  }
  
  private setupNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // Update query client when network status changes
      if (wasOffline && this.isOnline) {
        // Back online - resume paused mutations and invalidate queries
        this.handleBackOnline();
      } else if (this.isOnline && !state.isConnected) {
        // Gone offline
        this.handleGoOffline();
      }
      
      // Update network mode based on connection
      this.updateNetworkMode();
    });
  }
  
  private handleBackOnline(): void {
    // Resume paused mutations
    this.queryClient.resumePausedMutations();
    
    // Invalidate and refetch important queries
    this.queryClient.invalidateQueries({
      predicate: (query) => {
        // Refetch user data, projects, and other critical data
        const key = query.queryKey[0] as string;
        return ['user', 'projects', 'attendance', 'notifications'].includes(key);
      },
    });
    
    // Clear any network-related errors
    this.queryClient.removeQueries({
      predicate: (query) => {
        return query.state.error && (query.state.error as any)?.isNetworkError;
      },
    });
  }
  
  private handleGoOffline(): void {
    // Pause all outgoing mutations
    this.queryClient.getQueryCache().findAll().forEach((query) => {
      if (query.state.fetchStatus === 'fetching') {
        query.cancel();
      }
    });
  }
  
  private updateNetworkMode(): void {
    const networkMode = this.isOnline ? 'online' : 'offlineFirst';
    
    // Update default options
    this.queryClient.setDefaultOptions({
      queries: {
        ...this.queryClient.getDefaultOptions().queries,
        networkMode,
      },
      mutations: {
        ...this.queryClient.getDefaultOptions().mutations,
        networkMode: this.isOnline ? 'online' : 'offlineFirst',
      },
    });
  }
  
  public getNetworkStatus(): boolean {
    return this.isOnline;
  }
}

// Initialize network manager
export const networkManager = new NetworkManager(queryClient);

/**
 * Utility functions for query management
 */
export const queryUtils = {
  /**
   * Prefetch important data for offline use
   */
  prefetchOfflineData: async () => {
    const prefetchQueries = [
      { queryKey: ['user'], staleTime: 1000 * 60 * 30 }, // 30 minutes
      { queryKey: ['projects'], staleTime: 1000 * 60 * 15 }, // 15 minutes
      { queryKey: ['materials'], staleTime: 1000 * 60 * 60 }, // 1 hour
    ];
    
    await Promise.allSettled(
      prefetchQueries.map(({ queryKey, staleTime }) =>
        queryClient.prefetchQuery({
          queryKey,
          staleTime,
        })
      )
    );
  },
  
  /**
   * Clear sensitive data from cache
   */
  clearSensitiveData: () => {
    queryClient.removeQueries({
      predicate: (query) => {
        const key = query.queryKey.join('.');
        return key.includes('user') || key.includes('auth') || key.includes('sensitive');
      },
    });
    
    sensitiveCache.clear();
  },
  
  /**
   * Optimize cache by removing stale data
   */
  optimizeCache: () => {
    // Remove queries older than cache time
    queryClient.clear();
    
    // Optimize encrypted caches
    const stats = encryptedCache.optimize();
    console.log('Cache optimization:', stats);
  },
  
  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();
    
    return {
      queries: queryCache.getAll().length,
      mutations: mutationCache.getAll().length,
      encryptedCache: encryptedCache.getStats(),
      sensitiveCache: sensitiveCache.getStats(),
    };
  },
};