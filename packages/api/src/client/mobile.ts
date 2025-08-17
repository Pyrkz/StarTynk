// Export types
export * from './types/client.types';
export * from './types/offline.types';

// Export main clients  
export { UnifiedAPIClient } from './unified-client';
export { MobileAPIClient } from './mobile-api-client';

// Export adapters
export { WebHTTPAdapter } from './adapters/web-adapter';
export { MobileHTTPAdapter } from './adapters/mobile-adapter';

// Export cache managers
export { WebCacheManager } from './cache/web-cache';
export { MobileCacheManager } from './cache/mobile-cache';
export { CacheManager } from './cache-manager';

// Export offline components
export { NetworkMonitor } from './network-monitor';
export { SyncQueue } from './sync-queue';
export { ConflictResolver } from './conflict-resolver';
export { OptimisticManager } from './optimistic-manager';
export { RetryManager } from './retry-manager';
export { SyncStrategy } from './sync-strategy';
export { RequestInterceptor, ResponseInterceptor } from './interceptors';

// Platform-specific factories
import { UnifiedAPIClient } from './unified-client';
import { MobileAPIClient } from './mobile-api-client';
import { WebHTTPAdapter } from './adapters/web-adapter';
import { MobileHTTPAdapter } from './adapters/mobile-adapter';
import { WebCacheManager } from './cache/web-cache';
import { MobileCacheManager } from './cache/mobile-cache';
import type { UnifiedAuthService } from '@repo/auth/services';
import type { MobileAPIConfig } from './types/offline.types';

/**
 * Create API client for web platform
 */
export function createWebAPIClient(
  baseURL?: string,
  authService?: UnifiedAuthService
): UnifiedAPIClient {
  const url = baseURL || process.env.NEXT_PUBLIC_API_URL || '/api';
  const adapter = new WebHTTPAdapter(url);
  const cache = new WebCacheManager();
  
  return new UnifiedAPIClient(adapter, cache, authService);
}

/**
 * Create enhanced offline-first API client for mobile platform
 */
export function createMobileAPIClient(
  baseURL?: string,
  authService?: UnifiedAuthService,
  config?: MobileAPIConfig
): MobileAPIClient {
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
  
  return new MobileAPIClient(adapter, {
    ...config,
    userId: authService?.getCurrentUserId?.(),
  });
}

/**
 * Create legacy mobile API client (non-offline)
 */
export function createLegacyMobileAPIClient(
  baseURL?: string,
  authService?: UnifiedAuthService
): UnifiedAPIClient {
  const url = baseURL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  const adapter = new MobileHTTPAdapter(url);
  const cache = new MobileCacheManager();
  
  return new UnifiedAPIClient(adapter, cache, authService);
}

/**
 * Auto-detect platform and create appropriate API client
 */
export function createAPIClient(
  config?: {
    baseURL?: string;
    authService?: UnifiedAuthService;
    enableOffline?: boolean;
    mobileConfig?: MobileAPIConfig;
  }
): UnifiedAPIClient | MobileAPIClient {
  const { baseURL, authService, enableOffline = true, mobileConfig } = config || {};
  
  if (typeof window !== 'undefined' && !('expo' in (globalThis as any))) {
    return createWebAPIClient(baseURL, authService);
  } else {
    // Use offline-first client by default for mobile
    if (enableOffline) {
      return createMobileAPIClient(baseURL, authService, mobileConfig);
    }
    // Fallback to legacy client if offline is disabled
    return createLegacyMobileAPIClient(baseURL, authService);
  }
}

// Default export with auto-detection
export const apiClient = createAPIClient();