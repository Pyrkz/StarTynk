import { 
  QueryClient, 
  QueryClientConfig,
  MutationCache,
  QueryCache,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';

// Platform-specific network check
const getNetworkStatus = async (): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    return navigator.onLine;
  }
  // For React Native, this will be overridden
  return true;
};

// Global error handler
const handleGlobalError = (error: unknown): void => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      // Emit auth error event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
  }
};

// Toast notification function (will be implemented per platform)
let showNotification: ((options: { type: string; message: string }) => void) | null = null;

export const setNotificationHandler = (handler: (options: { type: string; message: string }) => void) => {
  showNotification = handler;
};

// Query cache configuration
const queryCache = new QueryCache({
  onError: (error, query) => {
    // Log errors for failed queries
    console.error(`Query failed: ${query.queryKey}`, error);
    handleGlobalError(error);
  },
  onSuccess: (data, query) => {
    // Log successful queries in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Query success: ${query.queryKey}`);
    }
  },
});

// Mutation cache configuration
const mutationCache = new MutationCache({
  onError: (error, variables, context, mutation) => {
    // Log mutation errors
    console.error(`Mutation failed: ${mutation.options.mutationKey}`, error);
    handleGlobalError(error);
    
    // Show error notification
    showNotification?.({
      type: 'error',
      message: error instanceof Error ? error.message : 'Operation failed',
    });
  },
  onSuccess: (data, variables, context, mutation) => {
    // Log successful mutations in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Mutation success: ${mutation.options.mutationKey}`);
    }
  },
});

// Query client configuration
const createQueryClient = (): QueryClient => {
  const config: QueryClientConfig = {
    queryCache,
    mutationCache,
    defaultOptions: {
      queries: {
        // Stale time: 5 minutes
        staleTime: 5 * 60 * 1000,
        // Cache time: 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof AxiosError) {
            if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
              return false;
            }
          }
          // Retry up to 3 times
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Network mode
        networkMode: 'offlineFirst',
        // Refetch on window focus
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
        // Refetch on reconnect
        refetchOnReconnect: true,
      },
      mutations: {
        // Network mode for mutations
        networkMode: 'offlineFirst',
        // Retry failed mutations
        retry: 1,
        retryDelay: 1000,
      },
    },
  };

  return new QueryClient(config);
};

// Export singleton instance
export const queryClient = createQueryClient();

// Utility to invalidate queries
export const invalidateQueries = (keys: string[]) => {
  keys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
};

// Utility to prefetch queries
export const prefetchQuery = async <T>(
  key: string[],
  fetcher: () => Promise<T>,
  staleTime?: number
) => {
  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: staleTime || 5 * 60 * 1000,
  });
};