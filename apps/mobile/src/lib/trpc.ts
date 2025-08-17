import { httpBatchLink, httpLink, loggerLink, splitLink } from '@trpc/client';
import superjson from 'superjson';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { env } from '../config/environment';
import { trpc, type AppRouter, type RouterInputs, type RouterOutputs } from './trpc-types';

// Re-export trpc from trpc-types
export { trpc } from './trpc-types';

/**
 * Get API base URL from environment
 */
function getApiUrl() {
  const url = env.current.apiUrl;
  // Remove any trailing /api/v1 from the URL and add /api/trpc
  const baseUrl = url.replace(/\/api\/v\d+\/?$/, '');
  return baseUrl.endsWith('/') ? `${baseUrl}api/trpc` : `${baseUrl}/api/trpc`;
}

/**
 * Get authentication token from secure storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('access_token');
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Check network connectivity
 */
async function isNetworkAvailable(): Promise<boolean> {
  const netInfo = await NetInfo.fetch();
  return !!(netInfo.isConnected && netInfo.isInternetReachable);
}

/**
 * Create tRPC client with mobile-specific configuration
 */
export function createMobileTRPCClient() {
  return trpc.createClient({
    links: [
      loggerLink({
        enabled: () => __DEV__,
      }),
      splitLink({
        condition(op) {
          // Use batch link for queries, regular link for mutations
          return op.type === 'query';
        },
        true: httpBatchLink({
          url: getApiUrl(),
          transformer: superjson,
          // maxBatchSize: 5, // Smaller batches for mobile
          // maxBatchTime: 100, // Faster batching for mobile responsiveness
          async headers() {
            const token = await getAuthToken();
            return {
              'authorization': token ? `Bearer ${token}` : '',
              'x-trpc-source': 'mobile',
              'x-platform': Platform.OS,
              'x-app-version': process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
            };
          },
          fetch: async (url, options) => {
            // Check network connectivity before making requests
            const isConnected = await isNetworkAvailable();
            if (!isConnected) {
              throw new Error('No internet connection');
            }

            // Add timeout for mobile networks
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000); // 15 seconds

            try {
              const response = await fetch(url, {
                ...options,
                signal: controller.signal,
              });
              return response;
            } finally {
              clearTimeout(timeout);
            }
          },
        }),
        false: httpLink({
          url: getApiUrl(),
          transformer: superjson,
          async headers() {
            const token = await getAuthToken();
            return {
              'authorization': token ? `Bearer ${token}` : '',
              'x-trpc-source': 'mobile',
              'x-platform': Platform.OS,
              'x-app-version': process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
            };
          },
          fetch: async (url, options) => {
            // Check network connectivity
            const isConnected = await isNetworkAvailable();
            if (!isConnected) {
              throw new Error('No internet connection');
            }

            // Add timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000); // 20 seconds for mutations

            try {
              const response = await fetch(url, {
                ...options,
                signal: controller.signal,
              });
              return response;
            } finally {
              clearTimeout(timeout);
            }
          },
        }),
      }),
    ],
  });
}

/**
 * Create retry link for mobile clients
 */
export function createRetryLink() {
  return (runtime: any) => {
    return ({ next, op }: any) => {
      return new Promise((resolve, reject) => {
        let attempt = 0;
        const maxRetries = 3;
        
        const tryRequest = () => {
          next(op).subscribe({
            next: resolve,
            error: (error: any) => {
              attempt++;
              
              // Determine if we should retry
              const shouldRetry = 
                attempt < maxRetries && 
                (error.message?.includes('No internet connection') ||
                 error.message?.includes('timeout') ||
                 error.data?.code === 'TIMEOUT' || 
                 error.data?.code === 'INTERNAL_SERVER_ERROR' ||
                 error.data?.httpStatus >= 500);
              
              if (shouldRetry) {
                // Exponential backoff with jitter
                const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                const jitter = Math.random() * 1000;
                const delay = baseDelay + jitter;
                
                setTimeout(tryRequest, delay);
              } else {
                reject(error);
              }
            },
          });
        };
        
        tryRequest();
      });
    };
  };
}

/**
 * Default tRPC client instance for convenience
 */
export const trpcClient = createMobileTRPCClient();

/**
 * Re-export type helpers for convenience
 */
// Re-export types
export type { RouterInputs, RouterOutputs } from './trpc-types';