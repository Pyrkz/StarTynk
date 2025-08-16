import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { trpc, createMobileTRPCClient } from '../lib/trpc';

interface TRPCProviderProps {
  children: React.ReactNode;
}

/**
 * Create persister for offline caching
 */
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
  key: 'TRPC_CACHE',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});

/**
 * Create query client with mobile-optimized settings
 */
function createMobileQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Offline-first strategy
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
        
        // Network-aware retries
        retry: (failureCount, error: any) => {
          // Don't retry on authentication errors
          if (error?.data?.code === 'UNAUTHORIZED') {
            return false;
          }
          
          // Don't retry on client errors (4xx)
          if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
            return false;
          }
          
          // Network errors or server errors - retry up to 3 times
          if (error?.message?.includes('No internet connection') || 
              error?.data?.httpStatus >= 500) {
            return failureCount < 3;
          }
          
          return failureCount < 2;
        },
        
        retryDelay: (attemptIndex) => {
          // Exponential backoff with max delay
          return Math.min(1000 * 2 ** attemptIndex, 30000);
        },
        
        // Refetch strategies
        refetchOnWindowFocus: false,
        refetchOnMount: 'always',
        refetchOnReconnect: 'always',
        
        // Network mode for offline support
        networkMode: 'offlineFirst',
      },
      mutations: {
        // Be more conservative with mutations
        retry: (failureCount, error: any) => {
          // Never retry auth errors
          if (error?.data?.code === 'UNAUTHORIZED') {
            return false;
          }
          
          // Only retry on network errors, not client/server errors
          if (error?.message?.includes('No internet connection') ||
              error?.message?.includes('timeout')) {
            return failureCount < 2;
          }
          
          return false;
        },
        
        retryDelay: 2000,
        networkMode: 'online', // Mutations require network
      },
    },
  });
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  const [queryClient] = useState(createMobileQueryClient);
  const [trpcClient] = useState(createMobileTRPCClient);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online);
      
      // Resume paused queries when coming back online
      if (online) {
        queryClient.resumePausedMutations();
        queryClient.invalidateQueries();
      }
    });

    return unsubscribe;
  }, [queryClient]);

  // Handle app state changes for background/foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground - check for stale data
        queryClient.invalidateQueries({
          predicate: (query) => {
            // Only invalidate if data is older than 5 minutes
            return Date.now() - (query.dataUpdatedAt || 0) > 5 * 60 * 1000;
          },
        });
      }
    };

    // Note: In a real app, you'd use AppState from react-native
    // This is a placeholder for the pattern
    
    return () => {
      // Cleanup listener
    };
  }, [queryClient]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ 
          persister,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          buster: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
        }}
        onSuccess={() => {
          // Invalidate queries after successful hydration
          queryClient.invalidateQueries();
        }}
      >
        {children}
        {/* You could add an offline indicator here */}
        {!isOnline && (
          <OfflineIndicator />
        )}
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
}

/**
 * Simple offline indicator component
 */
function OfflineIndicator() {
  return null; // You would implement your UI here
  // Example:
  // <View style={styles.offlineContainer}>
  //   <Text style={styles.offlineText}>You're offline</Text>
  // </View>
}

// Export the trpc instance for use in components
export { trpc };