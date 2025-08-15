import { offlineQueue } from './offline-queue';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock API client - replace with actual implementation
const apiClient = {
  get: async (url: string) => {
    const response = await fetch(url);
    return response.json();
  },
  post: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  put: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  delete: async (url: string) => {
    const response = await fetch(url, { method: 'DELETE' });
    return response.json();
  },
  patch: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

class OfflineAwareApi {
  private readonly CACHE_PREFIX = '@api_cache:';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    options?: {
      data?: any;
      cache?: boolean;
      priority?: 'low' | 'normal' | 'high';
      offline?: boolean;
    }
  ): Promise<T> {
    const netState = await NetInfo.fetch();
    const isOnline = netState.isConnected ?? false;

    // For GET requests, try cache first
    if (method === 'GET' && options?.cache !== false) {
      const cached = await this.getCache<T>(url);
      if (cached) {
        console.log(`Using cached data for ${url}`);
        // Return cached data and refresh in background if online
        if (isOnline) {
          this.refreshCache(url);
        }
        return cached;
      }
    }

    // If offline and mutation, queue the request
    if (!isOnline && method !== 'GET') {
      if (options?.offline !== false) {
        const queueId = await offlineQueue.add({
          url,
          method,
          data: options?.data,
          priority: options?.priority || 'normal',
          maxRetries: 3,
        });

        console.log(`Request queued for offline processing: ${method} ${url}`);

        // Return optimistic response
        return this.createOptimisticResponse<T>(method, url, options?.data);
      } else {
        throw new Error('No internet connection');
      }
    }

    // If online, make the request
    try {
      const methodKey = method.toLowerCase() as keyof typeof apiClient;
      const response = await apiClient[methodKey](url, options?.data);
      
      // Cache GET responses
      if (method === 'GET' && options?.cache !== false) {
        await this.setCache(url, response);
      }

      return response;
    } catch (error) {
      // If request fails and we have cache, return cached data
      if (method === 'GET') {
        const cached = await this.getCache<T>(url);
        if (cached) {
          console.warn(`Using cached data due to request failure for ${url}`);
          return cached;
        }
      }
      throw error;
    }
  }

  private async getCache<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        
        // Check if cache is still valid
        if (Date.now() - timestamp < this.CACHE_DURATION) {
          return data as T;
        } else {
          // Cache expired - remove it
          await AsyncStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    
    return null;
  }

  private async setCache(key: string, data: any): Promise<void> {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`Cached data for ${key}`);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  private async refreshCache(url: string): Promise<void> {
    try {
      const response = await apiClient.get(url);
      await this.setCache(url, response);
      console.log(`Cache refreshed for ${url}`);
    } catch (error) {
      // Silent fail - we already have cached data
      console.warn(`Failed to refresh cache for ${url}:`, error);
    }
  }

  private createOptimisticResponse<T>(
    method: string,
    url: string,
    data: any
  ): T {
    // Create optimistic response based on request type
    switch (method) {
      case 'POST':
        return {
          ...data,
          id: `optimistic-${Date.now()}`,
          createdAt: new Date().toISOString(),
          _optimistic: true,
        } as T;
      
      case 'PUT':
      case 'PATCH':
        return {
          ...data,
          updatedAt: new Date().toISOString(),
          _optimistic: true,
        } as T;
      
      case 'DELETE':
        return { success: true, _optimistic: true } as T;
      
      default:
        return data as T;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('API cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheStats() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      const cacheItems = await AsyncStorage.multiGet(cacheKeys);
      const now = Date.now();
      
      let totalSize = 0;
      let validItems = 0;
      let expiredItems = 0;

      for (const [key, value] of cacheItems) {
        if (value) {
          totalSize += value.length;
          try {
            const { timestamp } = JSON.parse(value);
            if (now - timestamp < this.CACHE_DURATION) {
              validItems++;
            } else {
              expiredItems++;
            }
          } catch {
            expiredItems++;
          }
        }
      }

      return {
        totalItems: cacheKeys.length,
        validItems,
        expiredItems,
        totalSize,
        averageItemSize: totalSize / cacheKeys.length || 0,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalItems: 0,
        validItems: 0,
        expiredItems: 0,
        totalSize: 0,
        averageItemSize: 0,
      };
    }
  }
}

export const offlineApi = new OfflineAwareApi();