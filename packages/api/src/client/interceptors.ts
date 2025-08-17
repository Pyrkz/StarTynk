import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import pako from 'pako';
import type { RequestConfig, APIResponse } from './types/client.types';

/**
 * Request interceptor for adding headers and transforming requests
 */
export class RequestInterceptor {
  private syncVersion: number = 0;
  private sessionId: string = this.generateSessionId();

  /**
   * Process request before sending
   */
  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    const enhancedConfig = { ...config };

    // Add default headers
    enhancedConfig.headers = {
      ...enhancedConfig.headers,
      'X-Client-Type': 'mobile',
      'X-Platform': Platform.OS,
      'X-Platform-Version': Platform.Version.toString(),
      'X-App-Version': Constants.expoConfig?.version || '1.0.0',
      'X-Session-ID': this.sessionId,
      'X-Sync-Version': this.syncVersion.toString(),
    };

    // Add device info for better debugging
    if (Device.isDevice) {
      enhancedConfig.headers['X-Device-Brand'] = Device.brand || 'unknown';
      enhancedConfig.headers['X-Device-Model'] = Device.modelName || 'unknown';
      enhancedConfig.headers['X-Device-OS'] = `${Device.osName} ${Device.osVersion}`;
    }

    // Add timestamp for sync purposes
    enhancedConfig.headers['X-Request-Time'] = new Date().toISOString();

    // Compress large payloads
    if (enhancedConfig.body && this.shouldCompress(enhancedConfig.body)) {
      try {
        const compressed = await this.compressData(enhancedConfig.body);
        enhancedConfig.body = compressed;
        enhancedConfig.headers['Content-Encoding'] = 'gzip';
        enhancedConfig.headers['X-Original-Size'] = JSON.stringify(enhancedConfig.body).length.toString();
      } catch (error) {
        console.warn('Failed to compress request body:', error);
      }
    }

    // Add idempotency key for non-GET requests
    if (config.method && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      enhancedConfig.headers['X-Idempotency-Key'] = this.generateIdempotencyKey(config);
    }

    return enhancedConfig;
  }

  /**
   * Update sync version
   */
  updateSyncVersion(version: number): void {
    this.syncVersion = version;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  // Private helper methods

  private shouldCompress(data: any): boolean {
    const size = JSON.stringify(data).length;
    return size > 1024; // Compress if > 1KB
  }

  private async compressData(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const compressed = pako.gzip(jsonString);
    return Buffer.from(compressed).toString('base64');
  }

  private generateIdempotencyKey(config: RequestConfig): string {
    const data = {
      method: config.method,
      body: config.body,
      timestamp: Math.floor(Date.now() / 60000), // 1-minute window
    };
    return this.hashCode(JSON.stringify(data));
  }

  private generateSessionId(): string {
    return `mobile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Response interceptor for processing responses and handling errors
 */
export class ResponseInterceptor {
  private requestInterceptor: RequestInterceptor;

  constructor(requestInterceptor?: RequestInterceptor) {
    this.requestInterceptor = requestInterceptor || new RequestInterceptor();
  }

  /**
   * Process successful response
   */
  async onResponse<T = any>(response: APIResponse<T>): Promise<APIResponse<T>> {
    // Update sync version if provided
    const syncVersion = response.headers['x-sync-version'];
    if (syncVersion && this.requestInterceptor) {
      this.requestInterceptor.updateSyncVersion(parseInt(syncVersion, 10));
    }

    // Decompress response if needed
    if (response.headers['content-encoding'] === 'gzip') {
      try {
        response.data = await this.decompressData(response.data);
      } catch (error) {
        console.warn('Failed to decompress response:', error);
      }
    }

    // Extract cache directives
    const cacheControl = response.headers['cache-control'];
    if (cacheControl) {
      response.config = response.config || {};
      response.config.cacheTTL = this.parseCacheControl(cacheControl);
    }

    // Handle 304 Not Modified
    if (response.status === 304) {
      console.debug('Resource not modified, using cache');
    }

    // Add response metadata
    const processed = {
      ...response,
      _metadata: {
        receivedAt: new Date().toISOString(),
        processingTime: response.headers['x-processing-time'],
        serverVersion: response.headers['x-server-version'],
        requestId: response.headers['x-request-id'],
      },
    };

    return processed;
  }

  /**
   * Process error response
   */
  async onError(error: any): Promise<any> {
    // Enhance error with additional context
    const enhanced = {
      ...error,
      timestamp: new Date().toISOString(),
      sessionId: this.requestInterceptor?.getSessionId(),
      platform: Platform.OS,
      networkInfo: await this.getNetworkInfo(),
    };

    // Log error for debugging
    console.error('API Error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      endpoint: error.config?.url,
      method: error.config?.method,
      requestId: error.response?.headers?.['x-request-id'],
    });

    // Transform specific error types
    if (error.code === 'ECONNABORTED') {
      enhanced.userMessage = 'Request timed out. Please check your connection and try again.';
      enhanced.isRetryable = true;
    } else if (error.isNetworkError) {
      enhanced.userMessage = 'No internet connection. Your request has been queued.';
      enhanced.isRetryable = true;
    } else if (error.status === 401) {
      enhanced.userMessage = 'Your session has expired. Please log in again.';
      enhanced.isRetryable = false;
      enhanced.requiresAuth = true;
    } else if (error.status === 429) {
      enhanced.userMessage = 'Too many requests. Please try again later.';
      enhanced.isRetryable = true;
      enhanced.retryAfter = parseInt(error.response?.headers?.['retry-after'] || '60', 10);
    } else if (error.status >= 500) {
      enhanced.userMessage = 'Server error. We\'re working on it.';
      enhanced.isRetryable = true;
    }

    return enhanced;
  }

  // Private helper methods

  private async decompressData(data: any): Promise<any> {
    if (typeof data !== 'string') return data;
    
    try {
      const binary = Buffer.from(data, 'base64');
      const decompressed = pako.ungzip(binary, { to: 'string' });
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('Decompression failed:', error);
      return data;
    }
  }

  private parseCacheControl(cacheControl: string): number {
    // Parse max-age from cache-control header
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    if (maxAgeMatch) {
      return parseInt(maxAgeMatch[1], 10);
    }
    
    // Check for no-cache directive
    if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
      return 0;
    }
    
    // Default cache time
    return 300; // 5 minutes
  }

  private async getNetworkInfo(): Promise<any> {
    try {
      const { default: NetInfo } = await import('@react-native-community/netinfo');
      return NetInfo.fetch();
    } catch {
      return null;
    }
  }
}