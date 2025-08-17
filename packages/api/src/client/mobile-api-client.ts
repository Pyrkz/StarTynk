import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';
import { MMKV } from 'react-native-mmkv';
import type { HTTPAdapter, APIResponse, RequestConfig, APIError } from './types/client.types';
import { CacheManager } from './cache-manager';
import { SyncQueue } from './sync-queue';
import { ConflictResolver } from './conflict-resolver';
import { NetworkMonitor } from './network-monitor';
import { OptimisticManager } from './optimistic-manager';
import { RequestInterceptor, ResponseInterceptor } from './interceptors';
import { RetryManager } from './retry-manager';
import type { SyncResult, MobileAPIConfig, QueuedOperation } from './types/offline.types';

/**
 * Offline-first mobile API client with intelligent caching and sync
 */
export class MobileAPIClient {
  private adapter: HTTPAdapter;
  private cache: CacheManager;
  private syncQueue: SyncQueue;
  private conflictResolver: ConflictResolver;
  private networkMonitor: NetworkMonitor;
  private optimisticManager: OptimisticManager;
  private requestInterceptor: RequestInterceptor;
  private responseInterceptor: ResponseInterceptor;
  private retryManager: RetryManager;
  private config: MobileAPIConfig;
  private isSyncing = false;

  constructor(adapter: HTTPAdapter, config: MobileAPIConfig = {}) {
    this.adapter = adapter;
    this.config = {
      enableOffline: true,
      cacheTTL: 3600, // 1 hour default
      syncInterval: 30000, // 30 seconds
      conflictStrategy: 'merge',
      maxRetries: 3,
      ...config,
    };

    // Initialize components
    this.cache = new CacheManager(this.config.cacheConfig);
    this.syncQueue = new SyncQueue();
    this.conflictResolver = new ConflictResolver();
    this.networkMonitor = new NetworkMonitor();
    this.optimisticManager = new OptimisticManager();
    this.requestInterceptor = new RequestInterceptor();
    this.responseInterceptor = new ResponseInterceptor();
    this.retryManager = new RetryManager();

    // Initialize network monitoring and auto-sync
    this.initialize();
  }

  private async initialize() {
    await this.networkMonitor.initialize();

    // Setup auto-sync when online
    if (this.config.syncInterval && this.config.syncInterval > 0) {
      this.networkMonitor.onStateChange(async (state) => {
        if (state.isConnected && !this.isSyncing) {
          await this.sync();
        }
      });

      // Periodic sync when online
      setInterval(async () => {
        const state = await this.networkMonitor.getCurrentState();
        if (state.isConnected && !this.isSyncing) {
          await this.sync();
        }
      }, this.config.syncInterval);
    }
  }

  /**
   * GET request with intelligent caching
   */
  async get<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
    const cacheKey = this.generateCacheKey('GET', endpoint, options);
    
    // Try cache first
    if (options.cache !== 'no-cache') {
      const cached = await this.cache.get<T>(cacheKey);
      if (cached && options.cache !== 'reload') {
        // Check if we should revalidate in background
        if (this.shouldRevalidate(cached)) {
          this.revalidateInBackground(endpoint, options, cacheKey);
        }
        return cached.data;
      }
    }

    // Check network state
    const networkState = await this.networkMonitor.getCurrentState();
    
    // If offline and no cache, check optimistic data
    if (!networkState.isConnected) {
      const optimistic = await this.optimisticManager.getOptimisticData(cacheKey);
      if (optimistic) {
        return optimistic;
      }
      
      // Return cached data even if expired when offline
      const cached = await this.cache.get<T>(cacheKey);
      if (cached) {
        return cached.data;
      }
      
      throw this.createOfflineError('GET', endpoint);
    }

    // Execute request with retry logic
    try {
      const config = await this.requestInterceptor.onRequest({
        ...options,
        method: 'GET',
      });

      const response = await this.retryManager.executeWithRetry(
        () => this.adapter.get<T>(endpoint, config),
        {
          maxAttempts: options.maxRetries || this.config.maxRetries,
          retryableErrors: ['NETWORK_ERROR', 'TIMEOUT'],
        }
      );

      const processedResponse = await this.responseInterceptor.onResponse(response);

      // Cache the response
      if (options.cache !== 'no-cache') {
        await this.cache.set(
          cacheKey,
          processedResponse.data,
          options.cacheTTL || this.config.cacheTTL
        );
      }

      return processedResponse.data;
    } catch (error) {
      // Fallback to cache on error
      const cached = await this.cache.get<T>(cacheKey);
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * POST request with offline queueing
   */
  async post<T>(endpoint: string, data: any, options: RequestConfig = {}): Promise<T> {
    const networkState = await this.networkMonitor.getCurrentState();
    
    // Generate optimistic response
    const optimisticResponse = this.optimisticManager.generateOptimisticResponse(
      'POST',
      endpoint,
      data
    );

    // Apply optimistic update immediately
    if (optimisticResponse && options.offlineQueue !== false) {
      const cacheKey = this.generateCacheKey('POST', endpoint, { ...options, body: data });
      await this.optimisticManager.applyOptimistic(cacheKey, optimisticResponse);
    }

    // Queue if offline
    if (!networkState.isConnected && options.offlineQueue !== false) {
      const queueId = await this.syncQueue.enqueue({
        method: 'POST',
        endpoint,
        data,
        headers: options.headers,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: options.maxRetries || this.config.maxRetries || 3,
        priority: this.determinePriority(endpoint, 'POST'),
        conflictStrategy: this.config.conflictStrategy || 'last-write-wins',
        optimisticResponse,
      });

      // Return optimistic response
      if (optimisticResponse) {
        return optimisticResponse as T;
      }

      throw this.createOfflineError('POST', endpoint, queueId);
    }

    // Execute request online
    try {
      const config = await this.requestInterceptor.onRequest({
        ...options,
        method: 'POST',
        body: data,
      });

      const response = await this.retryManager.executeWithRetry(
        () => this.adapter.post<T>(endpoint, data, config),
        {
          maxAttempts: options.maxRetries || this.config.maxRetries,
        }
      );

      const processedResponse = await this.responseInterceptor.onResponse(response);

      // Commit optimistic update
      if (optimisticResponse) {
        const cacheKey = this.generateCacheKey('POST', endpoint, { ...options, body: data });
        await this.optimisticManager.commit(cacheKey);
      }

      return processedResponse.data;
    } catch (error) {
      // Rollback optimistic update on failure
      if (optimisticResponse) {
        const cacheKey = this.generateCacheKey('POST', endpoint, { ...options, body: data });
        await this.optimisticManager.rollback(cacheKey);
      }

      // Queue for retry if network error
      if (this.isNetworkError(error) && options.offlineQueue !== false) {
        const queueId = await this.syncQueue.enqueue({
          method: 'POST',
          endpoint,
          data,
          headers: options.headers,
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: options.maxRetries || this.config.maxRetries || 3,
          priority: this.determinePriority(endpoint, 'POST'),
          conflictStrategy: this.config.conflictStrategy || 'last-write-wins',
          optimisticResponse,
        });

        if (optimisticResponse) {
          return optimisticResponse as T;
        }
      }

      throw error;
    }
  }

  /**
   * PUT request with offline queueing
   */
  async put<T>(endpoint: string, data: any, options: RequestConfig = {}): Promise<T> {
    const networkState = await this.networkMonitor.getCurrentState();
    
    // Similar to POST but with PUT-specific handling
    const optimisticResponse = this.optimisticManager.generateOptimisticResponse(
      'PUT',
      endpoint,
      data
    );

    if (optimisticResponse && options.offlineQueue !== false) {
      const cacheKey = this.generateCacheKey('PUT', endpoint, { ...options, body: data });
      await this.optimisticManager.applyOptimistic(cacheKey, optimisticResponse);
    }

    if (!networkState.isConnected && options.offlineQueue !== false) {
      const queueId = await this.syncQueue.enqueue({
        method: 'PUT',
        endpoint,
        data,
        headers: options.headers,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: options.maxRetries || this.config.maxRetries || 3,
        priority: this.determinePriority(endpoint, 'PUT'),
        conflictStrategy: this.config.conflictStrategy || 'last-write-wins',
        optimisticResponse,
      });

      if (optimisticResponse) {
        return optimisticResponse as T;
      }

      throw this.createOfflineError('PUT', endpoint, queueId);
    }

    try {
      const config = await this.requestInterceptor.onRequest({
        ...options,
        method: 'PUT',
        body: data,
      });

      const response = await this.retryManager.executeWithRetry(
        () => this.adapter.put<T>(endpoint, data, config),
        {
          maxAttempts: options.maxRetries || this.config.maxRetries,
        }
      );

      const processedResponse = await this.responseInterceptor.onResponse(response);

      if (optimisticResponse) {
        const cacheKey = this.generateCacheKey('PUT', endpoint, { ...options, body: data });
        await this.optimisticManager.commit(cacheKey);
      }

      // Invalidate related cache entries
      await this.cache.invalidate(endpoint);

      return processedResponse.data;
    } catch (error) {
      if (optimisticResponse) {
        const cacheKey = this.generateCacheKey('PUT', endpoint, { ...options, body: data });
        await this.optimisticManager.rollback(cacheKey);
      }

      if (this.isNetworkError(error) && options.offlineQueue !== false) {
        const queueId = await this.syncQueue.enqueue({
          method: 'PUT',
          endpoint,
          data,
          headers: options.headers,
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: options.maxRetries || this.config.maxRetries || 3,
          priority: this.determinePriority(endpoint, 'PUT'),
          conflictStrategy: this.config.conflictStrategy || 'last-write-wins',
          optimisticResponse,
        });

        if (optimisticResponse) {
          return optimisticResponse as T;
        }
      }

      throw error;
    }
  }

  /**
   * DELETE request with offline queueing
   */
  async delete(endpoint: string, options: RequestConfig = {}): Promise<void> {
    const networkState = await this.networkMonitor.getCurrentState();

    if (!networkState.isConnected && options.offlineQueue !== false) {
      await this.syncQueue.enqueue({
        method: 'DELETE',
        endpoint,
        headers: options.headers,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: options.maxRetries || this.config.maxRetries || 3,
        priority: this.determinePriority(endpoint, 'DELETE'),
        conflictStrategy: 'last-write-wins',
      });

      // Optimistically remove from cache
      await this.cache.invalidate(endpoint);

      throw this.createOfflineError('DELETE', endpoint);
    }

    try {
      const config = await this.requestInterceptor.onRequest({
        ...options,
        method: 'DELETE',
      });

      await this.retryManager.executeWithRetry(
        () => this.adapter.delete(endpoint, config),
        {
          maxAttempts: options.maxRetries || this.config.maxRetries,
        }
      );

      // Invalidate cache
      await this.cache.invalidate(endpoint);
    } catch (error) {
      if (this.isNetworkError(error) && options.offlineQueue !== false) {
        await this.syncQueue.enqueue({
          method: 'DELETE',
          endpoint,
          headers: options.headers,
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: options.maxRetries || this.config.maxRetries || 3,
          priority: this.determinePriority(endpoint, 'DELETE'),
          conflictStrategy: 'last-write-wins',
        });

        // Still invalidate cache optimistically
        await this.cache.invalidate(endpoint);
      }

      throw error;
    }
  }

  /**
   * Sync queued operations
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        newData: [],
        errors: [{ message: 'Sync already in progress' }],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      newData: [],
      errors: [],
    };

    try {
      const networkState = await this.networkMonitor.getCurrentState();
      if (!networkState.isConnected) {
        throw new Error('No network connection');
      }

      // Get queued operations
      const operations = await this.syncQueue.peek();
      
      // Sort by priority and timestamp
      const sortedOps = this.sortOperations(operations);

      // Process in batches based on connection quality
      const quality = await this.networkMonitor.getConnectionQuality();
      const batchSize = this.calculateBatchSize(quality);

      for (let i = 0; i < sortedOps.length; i += batchSize) {
        const batch = sortedOps.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (op) => {
            try {
              await this.processSyncOperation(op);
              await this.syncQueue.remove(op.id);
              result.synced++;
            } catch (error) {
              if (this.isConflictError(error)) {
                result.conflicts++;
                // Handle conflict
                try {
                  await this.handleConflict(op, error);
                  result.synced++;
                } catch (conflictError) {
                  result.failed++;
                  result.errors.push({
                    operation: op,
                    error: conflictError,
                  });
                }
              } else {
                result.failed++;
                result.errors.push({
                  operation: op,
                  error,
                });
                
                // Retry logic
                if (op.retryCount < op.maxRetries) {
                  await this.syncQueue.retry(op.id);
                }
              }
            }
          })
        );
      }

      result.success = result.failed === 0;
    } catch (error) {
      result.success = false;
      result.errors.push({ message: error instanceof Error ? error.message : String(error) });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<any> {
    return this.networkMonitor.getCurrentState();
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Clear sync queue
   */
  async clearQueue(): Promise<void> {
    await this.syncQueue.clear();
  }

  /**
   * Get cache size
   */
  async getCacheSize(): Promise<number> {
    return this.cache.getSize();
  }

  /**
   * Get queue size
   */
  async getQueueSize(): Promise<number> {
    const operations = await this.syncQueue.peek();
    return operations.length;
  }

  // Private helper methods

  private generateCacheKey(method: string, url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    const userId = this.config.userId || 'anonymous';
    return `${method}:${url}:${paramString}:${userId}`;
  }

  private shouldRevalidate(cached: any): boolean {
    // Revalidate if older than 50% of TTL
    const age = Date.now() - cached.timestamp;
    const halfTTL = (cached.ttl * 1000) / 2;
    return age > halfTTL;
  }

  private async revalidateInBackground(
    endpoint: string,
    options: RequestConfig,
    cacheKey: string
  ): Promise<void> {
    try {
      const response = await this.adapter.get(endpoint, options);
      await this.cache.set(
        cacheKey,
        response.data,
        options.cacheTTL || this.config.cacheTTL
      );
    } catch (error) {
      // Silent fail for background revalidation
      console.debug('Background revalidation failed:', error);
    }
  }

  private createOfflineError(
    method: string,
    endpoint: string,
    queueId?: string
  ): APIError {
    return {
      message: `Offline: ${method} ${endpoint} has been queued`,
      code: 'OFFLINE',
      isNetworkError: true,
      data: { queueId },
    };
  }

  private isNetworkError(error: any): boolean {
    return (
      error?.isNetworkError ||
      error?.code === 'NETWORK_ERROR' ||
      error?.code === 'ECONNABORTED' ||
      !navigator.onLine
    );
  }

  private isConflictError(error: any): boolean {
    return error?.status === 409 || error?.code === 'CONFLICT';
  }

  private determinePriority(
    endpoint: string,
    method: string
  ): 'high' | 'normal' | 'low' {
    // Auth endpoints are critical
    if (endpoint.includes('/auth') || endpoint.includes('/login')) {
      return 'high';
    }
    
    // User profile updates are high priority
    if (endpoint.includes('/user') || endpoint.includes('/profile')) {
      return 'high';
    }
    
    // Task completions are high priority
    if (endpoint.includes('/tasks') && (method === 'PUT' || method === 'PATCH')) {
      return 'high';
    }
    
    // Analytics are low priority
    if (endpoint.includes('/analytics') || endpoint.includes('/telemetry')) {
      return 'low';
    }
    
    return 'normal';
  }

  private sortOperations(operations: QueuedOperation[]): QueuedOperation[] {
    const priorityOrder: Record<'critical' | 'high' | 'normal' | 'low', number> = { 
      critical: 0, 
      high: 1, 
      normal: 2, 
      low: 3 
    };
    
    return operations.sort((a, b) => {
      // Sort by priority first
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by timestamp
      return a.timestamp - b.timestamp;
    });
  }

  private calculateBatchSize(quality: number): number {
    // Quality: 0=offline, 1=poor, 2=fair, 3=good, 4=excellent
    switch (quality) {
      case 4: return 10; // Excellent - WiFi/5G
      case 3: return 5;  // Good - 4G
      case 2: return 3;  // Fair - 3G
      case 1: return 1;  // Poor - 2G
      default: return 0;
    }
  }

  private async processSyncOperation(operation: any): Promise<void> {
    const { method, endpoint, data, headers } = operation;
    
    switch (method) {
      case 'POST':
        await this.adapter.post(endpoint, data, { headers });
        break;
      case 'PUT':
        await this.adapter.put(endpoint, data, { headers });
        break;
      case 'PATCH':
        await this.adapter.patch(endpoint, data, { headers });
        break;
      case 'DELETE':
        await this.adapter.delete(endpoint, { headers });
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  private async handleConflict(operation: any, error: any): Promise<void> {
    const { method, endpoint, data } = operation;
    
    // Get server version
    const serverData = error.data?.serverVersion;
    if (!serverData) {
      throw new Error('Cannot resolve conflict: no server data');
    }
    
    // Resolve conflict
    const resolved = await this.conflictResolver.resolve(
      data,
      serverData,
      operation.conflictStrategy || this.config.conflictStrategy,
      {
        localTimestamp: operation.timestamp,
        remoteTimestamp: serverData.updatedAt,
        userId: this.config.userId || '',
        deviceId: this.config.deviceId || '',
        syncVersion: operation.syncVersion,
      }
    );
    
    // Retry with resolved data
    switch (method) {
      case 'PUT':
      case 'PATCH':
        await this.adapter.put(endpoint, resolved, { headers: operation.headers });
        break;
      default:
        throw new Error(`Cannot resolve conflict for method: ${method}`);
    }
  }
}