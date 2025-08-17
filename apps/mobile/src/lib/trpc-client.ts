import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './trpc-types';
import superjson from 'superjson';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { env } from '../config/environment';

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
 * Create a vanilla TRPC client for use outside of React components
 * This is useful for services, utilities, and class-based code
 */
export const trpcClient = createTRPCProxyClient<AppRouter>({
  // transformer: superjson, // Moved to link
  links: [
    httpBatchLink({
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
  ],
});

// Export a typed client
export type TRPCClient = typeof trpcClient;