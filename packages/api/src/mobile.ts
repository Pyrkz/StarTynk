// Mobile-specific exports - includes React Native dependencies

// Re-export everything from index
export * from './index';

// Mobile-specific exports
export { MobileAPIClient } from './client/mobile-api-client';
export { MobileHTTPAdapter } from './client/adapters/mobile-adapter';
export { MobileCacheManager } from './client/cache/mobile-cache';
export { NetworkMonitor } from './client/network-monitor';
export { SyncQueue } from './client/sync-queue';
export { ConflictResolver } from './client/conflict-resolver';
export { OptimisticManager } from './client/optimistic-manager';
export { RetryManager } from './client/retry-manager';
export { SyncStrategy } from './client/sync-strategy';
export { RequestInterceptor, ResponseInterceptor } from './client/interceptors';

// Mobile-specific types
export * from './client/types/offline.types';

// Platform-specific factories for mobile
import { UnifiedAPIClient } from './client/unified-client';
import { MobileAPIClient } from './client/mobile-api-client';
import { MobileHTTPAdapter } from './client/adapters/mobile-adapter';
import { MobileCacheManager } from './client/cache/mobile-cache';
import type { UnifiedAuthService } from '@repo/auth';
import type { MobileAPIConfig } from './client/types/offline.types';

/**
 * Create enhanced offline-first API client for mobile platform
 */
export async function createMobileAPIClient(
  baseURL?: string,
  authService?: UnifiedAuthService,
  config?: MobileAPIConfig
): Promise<MobileAPIClient> {
  const url = baseURL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  const adapter = new MobileHTTPAdapter(url);
  
  // Add auth service to adapter if provided
  if (authService && adapter.client?.interceptors) {
    adapter.client.interceptors.request.use(
      async (config) => {
        const token = await authService.getAccessToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }
  
  let userId: string | undefined;
  if (authService && typeof authService.getCurrentUser === 'function') {
    const user = await authService.getCurrentUser();
    userId = user?.id;
  }
  
  return new MobileAPIClient(adapter, {
    ...config,
    userId,
  });
}

/**
 * Create legacy mobile API client (non-offline)
 */
export function createLegacyMobileAPIClient(
  baseURL?: string,
  authService?: any
): UnifiedAPIClient {
  const url = baseURL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  const adapter = new MobileHTTPAdapter(url);
  const cache = new MobileCacheManager();
  
  return new UnifiedAPIClient(adapter, cache, authService);
}

// Default export for mobile with offline support
export const apiClient = createMobileAPIClient();