import type { UnifiedUser } from '@repo/shared/types';

/**
 * HTTP methods supported by the client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request configuration options
 */
export interface RequestConfig {
  // Standard options
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  
  // Cache options
  cache?: 'default' | 'no-cache' | 'reload' | 'force-cache';
  cacheTTL?: number; // seconds
  
  // Offline options (mobile)
  offlineQueue?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
  
  // Auth options
  requireAuth?: boolean;
  skipAuthRefresh?: boolean;
  
  // Response options
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  validateStatus?: (status: number) => boolean;
}

/**
 * API Response wrapper
 */
export interface APIResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

/**
 * Error response structure
 */
export interface APIError {
  message: string;
  status?: number;
  code?: string;
  data?: any;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
}

/**
 * Cache entry structure
 */
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
}

/**
 * Offline queue entry (mobile)
 */
export interface QueueEntry {
  id: string;
  url: string;
  config: RequestConfig;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Platform-specific adapter interface
 */
export interface HTTPAdapter {
  request<T = any>(url: string, config: RequestConfig): Promise<APIResponse<T>>;
  get<T = any>(url: string, config?: RequestConfig): Promise<APIResponse<T>>;
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>>;
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<APIResponse<T>>;
}

/**
 * Cache manager interface
 */
export interface CacheManager {
  get<T = any>(key: string): Promise<CacheEntry<T> | null>;
  set<T = any>(key: string, data: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * Queue manager interface (mobile only)
 */
export interface QueueManager {
  add(url: string, config: RequestConfig, priority?: 'high' | 'medium' | 'low'): Promise<string>;
  process(): Promise<void>;
  clear(): Promise<void>;
  getQueueSize(): Promise<number>;
  retry(id: string): Promise<void>;
}