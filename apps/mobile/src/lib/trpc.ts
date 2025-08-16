import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, httpLink, loggerLink, splitLink } from '@trpc/client';
import type { AppRouter } from '@repo/trpc';
import superjson from 'superjson';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

/**
 * Create tRPC React hooks for mobile
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Get API base URL from environment
 */
function getApiUrl() {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error('EXPO_PUBLIC_API_URL environment variable is not set');
  }
  return url.endsWith('/') ? `${url}api/trpc` : `${url}/api/trpc`;
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
  return netInfo.isConnected && netInfo.isInternetReachable;
}

/**
 * Create tRPC client with mobile-specific configuration
 */
export function createMobileTRPCClient() {
  return trpc.createClient({
    transformer: superjson,
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
          maxBatchSize: 5, // Smaller batches for mobile
          maxBatchTime: 100, // Faster batching for mobile responsiveness
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
 * Type helpers for router inputs and outputs
 */
export type RouterInputs = typeof trpc extends createTRPCReact<infer T> ? T : never;
export type RouterOutputs = typeof trpc extends createTRPCReact<infer T> ? T : never;