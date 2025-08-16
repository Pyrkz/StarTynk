// Export types
export * from './types/client.types';

// Export main client
export { UnifiedAPIClient } from './unified-client';

// Export adapters
export { WebHTTPAdapter } from './adapters/web-adapter';
export { MobileHTTPAdapter } from './adapters/mobile-adapter';

// Export cache managers
export { WebCacheManager } from './cache/web-cache';
export { MobileCacheManager } from './cache/mobile-cache';

// Platform-specific factories
import { UnifiedAPIClient } from './unified-client';
import { WebHTTPAdapter } from './adapters/web-adapter';
import { MobileHTTPAdapter } from './adapters/mobile-adapter';
import { WebCacheManager } from './cache/web-cache';
import { MobileCacheManager } from './cache/mobile-cache';
import type { UnifiedAuthService } from '@repo/auth/services/auth.service';

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
 * Create API client for mobile platform
 */
export function createMobileAPIClient(
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
  baseURL?: string,
  authService?: UnifiedAuthService
): UnifiedAPIClient {
  if (typeof window !== 'undefined' && !('expo' in (globalThis as any))) {
    return createWebAPIClient(baseURL, authService);
  } else {
    return createMobileAPIClient(baseURL, authService);
  }
}

// Default export with auto-detection
export const apiClient = createAPIClient();