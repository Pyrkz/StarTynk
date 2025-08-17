// Export types (safe for web)
export * from './types/client.types';

// Export web-compatible clients only
export { UnifiedAPIClient } from './unified-client';

// Export web adapters
export { WebHTTPAdapter } from './adapters/web-adapter';

// Export web cache
export { WebCacheManager } from './cache/web-cache';

// Web-specific factory
import { UnifiedAPIClient } from './unified-client';
import { WebHTTPAdapter } from './adapters/web-adapter';
import { WebCacheManager } from './cache/web-cache';
import type { UnifiedAuthService } from '@repo/auth/services';

/**
 * Create API client for web platform
 * Only includes web-compatible dependencies
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
 * Create API client with auto-detection (web-only)
 */
export function createAPIClient(config?: {
  baseURL?: string;
  authService?: UnifiedAuthService;
}): UnifiedAPIClient {
  const { baseURL, authService } = config || {};
  return createWebAPIClient(baseURL, authService);
}

// Default export for web
export const apiClient = createAPIClient();