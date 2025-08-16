import { MMKV } from 'react-native-mmkv';
import type { CacheManager, CacheEntry } from '../types/client.types';

/**
 * Mobile cache manager using MMKV
 * High-performance encrypted cache for React Native
 */
export class MobileCacheManager implements CacheManager {
  private storage: MMKV;

  constructor() {
    this.storage = new MMKV({
      id: 'api-cache',
      encryptionKey: 'api-cache-encryption-key',
    });
  }

  async get<T = any>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const item = this.storage.getString(key);
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

      this.storage.set(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clearAll();
  }

  async has(key: string): Promise<boolean> {
    return this.storage.contains(key);
  }
}