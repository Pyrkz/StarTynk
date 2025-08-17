import type { UnifiedAuthService } from '@repo/auth/services';
import { ClientType } from '@repo/shared';
import type { 
  HTTPAdapter, 
  CacheManager, 
  QueueManager,
  RequestConfig, 
  APIResponse,
  APIError 
} from './types/client.types';

/**
 * Unified API Client
 * Platform-agnostic HTTP client with automatic auth, caching, and offline support
 */
export class UnifiedAPIClient {
  private adapter: HTTPAdapter;
  private cache: CacheManager;
  private queue?: QueueManager;
  private authService?: UnifiedAuthService;
  private baseURL: string;

  constructor(
    adapter: HTTPAdapter,
    cache: CacheManager,
    authService?: UnifiedAuthService,
    queue?: QueueManager
  ) {
    this.adapter = adapter;
    this.cache = cache;
    this.authService = authService;
    this.queue = queue;
    this.baseURL = '';
  }

  /**
   * Make HTTP request with automatic auth, caching, and error handling
   */
  async request<T = any>(url: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    const mergedConfig = this.mergeConfig(config);
    
    // Add auth headers if required
    if (mergedConfig.requireAuth !== false && this.authService) {
      const token = await this.authService.getAccessToken();
      if (token) {
        mergedConfig.headers = {
          ...mergedConfig.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    // Check cache for GET requests
    if (mergedConfig.method === 'GET' && mergedConfig.cache !== 'no-cache') {
      const cacheKey = this.getCacheKey(url, mergedConfig);
      const cached = await this.cache.get<T>(cacheKey);
      if (cached) {
        return {
          data: cached.data,
          status: 200,
          statusText: 'OK (cached)',
          headers: {},
          config: mergedConfig,
        };
      }
    }

    try {
      const response = await this.adapter.request<T>(url, mergedConfig);
      
      // Cache successful GET responses
      if (
        mergedConfig.method === 'GET' && 
        response.status >= 200 && 
        response.status < 300 &&
        mergedConfig.cache !== 'no-cache'
      ) {
        const cacheKey = this.getCacheKey(url, mergedConfig);
        await this.cache.set(cacheKey, response.data, mergedConfig.cacheTTL);
      }

      return response;
    } catch (error) {
      return this.handleError(error as APIError, url, mergedConfig);
    }
  }

  /**
   * GET request with caching
   */
  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.request<T>(url, { ...config, method: 'GET' });
    return response.data;
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.request<T>(url, { 
      ...config, 
      method: 'POST', 
      body: data,
      cache: 'no-cache' // Never cache POST requests
    });
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.request<T>(url, { 
      ...config, 
      method: 'PUT', 
      body: data,
      cache: 'no-cache'
    });
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.request<T>(url, { 
      ...config, 
      method: 'PATCH', 
      body: data,
      cache: 'no-cache'
    });
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.request<T>(url, { 
      ...config, 
      method: 'DELETE',
      cache: 'no-cache'
    });
    return response.data;
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Get cache size (mobile only)
   */
  async getCacheSize(): Promise<number> {
    // Implementation depends on cache manager
    return 0;
  }

  /**
   * Set auth service for automatic token handling
   */
  setAuthService(authService: UnifiedAuthService): void {
    this.authService = authService;
  }

  private mergeConfig(config: RequestConfig): RequestConfig {
    return {
      timeout: 30000,
      requireAuth: true,
      cache: 'default',
      cacheTTL: 300, // 5 minutes
      offlineQueue: true,
      retryOnFailure: true,
      maxRetries: 3,
      responseType: 'json',
      ...config,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers,
      },
    };
  }

  private getCacheKey(url: string, config: RequestConfig): string {
    const params = new URLSearchParams();
    if (config.body && config.method === 'GET') {
      params.append('params', JSON.stringify(config.body));
    }
    return `${url}?${params.toString()}`;
  }

  private async handleError(error: APIError, url: string, config: RequestConfig): Promise<never> {
    // Handle auth errors
    if (error.status === 401 && this.authService && !config.skipAuthRefresh) {
      try {
        // Note: refreshAuth requires parameters - this is a placeholder implementation
        // In real usage, the client would need to store refresh token and device info
        const refreshResult = await this.authService.refreshAuth('', ClientType.MOBILE);
        if (refreshResult.success) {
          // Retry request with new token
          return this.request(url, { ...config, skipAuthRefresh: true }) as never;
        }
      } catch (refreshError) {
        // Refresh failed, emit auth expired event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      }
    }

    // Handle offline errors (mobile)
    if (error.isNetworkError && this.queue && config.offlineQueue) {
      if (config.method !== 'GET') { // Only queue mutations
        await this.queue.add(url, config);
        throw new Error('Request queued for when online');
      }
    }

    throw error;
  }
}