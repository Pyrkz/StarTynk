// Web-specific exports that don't include React Native dependencies

// Handlers
export * from './handlers';

// Middleware
export * from './middleware';

// Validators
export * from './validators';

// Responses
export * from './responses';

// Errors
export * from './errors';

// Utils
export * from './utils';

// Types
export * from './types';
export * from './client/types/client.types';

// Config
export * from './config/cache.config';

// Services
export * from './services';

// Web-specific client components
export { UnifiedAPIClient } from './client/unified-client';
export { WebHTTPAdapter } from './client/adapters/web-adapter';
export { WebCacheManager } from './client/cache/web-cache';
export { CacheManager } from './client/cache-manager';

// Platform-specific factory for web
import { UnifiedAPIClient } from './client/unified-client';
import { WebHTTPAdapter } from './client/adapters/web-adapter';
import { WebCacheManager } from './client/cache/web-cache';
import type { UnifiedAuthService } from '@repo/auth/services';

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

// Default export for web
export const apiClient = createWebAPIClient();