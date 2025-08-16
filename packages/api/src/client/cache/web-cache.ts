import type { CacheManager, CacheEntry } from '../types/client.types';

/**
 * Web cache manager using localStorage
 * Simple key-value storage with TTL support
 */
export class WebCacheManager implements CacheManager {
  private prefix = 'api_cache_';

  async get<T = any>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check if expired
      if (Date.now() > entry.timestamp + (entry.ttl * 1000)) {
        await this.delete(key);
        return null;
      }

      return entry;
    } catch {
      return null;
    }
  }

  async set<T = any>(key: string, data: T, ttl = 300): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }

  async has(key: string): Promise<boolean> {
    const entry = await this.get(key);
    return entry !== null;
  }
}