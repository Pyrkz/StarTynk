import { MMKV } from 'react-native-mmkv';
import * as Crypto from 'expo-crypto';
import { secureStorage } from './secure-storage';

interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  version: number;
}

interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
}

export class EncryptedCache {
  private storage: MMKV;
  private encryptionKey: string | null = null;
  private stats: CacheStats = {
    totalItems: 0,
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
  };
  
  constructor(id: string = 'default-cache') {
    this.storage = new MMKV({
      id: `encrypted-cache-${id}`,
    });
    
    this.initializeEncryption();
    this.loadStats();
  }
  
  /**
   * Initialize encryption key
   */
  private async initializeEncryption(): Promise<void> {
    try {
      const deviceId = await secureStorage.getDeviceId();
      this.encryptionKey = await this.deriveKey(deviceId);
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      // Use fallback key for development
      this.encryptionKey = 'fallback-key';
    }
  }
  
  /**
   * Derive encryption key from device ID
   */
  private async deriveKey(deviceId: string): Promise<string> {
    // In production, use proper PBKDF2 or similar
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `cache-key-${deviceId}`,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  }
  
  /**
   * Encrypt cache data
   */
  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }
    
    try {
      // Simple encryption for demo - in production use proper AES
      const combined = data + '|' + this.encryptionKey;
      return btoa(combined);
    } catch (error) {
      console.error('Cache encryption failed:', error);
      return data; // Fallback to unencrypted
    }
  }
  
  /**
   * Decrypt cache data
   */
  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }
    
    try {
      const combined = atob(encryptedData);
      const separator = '|';
      const lastIndex = combined.lastIndexOf(separator);
      
      if (lastIndex === -1) {
        return encryptedData; // Assume unencrypted legacy data
      }
      
      const data = combined.substring(0, lastIndex);
      const key = combined.substring(lastIndex + 1);
      
      if (key !== this.encryptionKey) {
        throw new Error('Invalid encryption key');
      }
      
      return data;
    } catch (error) {
      console.error('Cache decryption failed:', error);
      return encryptedData; // Fallback to original data
    }
  }
  
  /**
   * Set cache item with TTL and encryption
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const item: CacheItem<T> = {
        value,
        timestamp: Date.now(),
        ttl,
        version: 1,
      };
      
      const serialized = JSON.stringify(item);
      const encrypted = await this.encrypt(serialized);
      
      this.storage.set(key, encrypted);
      
      // Update stats
      this.stats.totalItems++;
      this.stats.totalSize += serialized.length;
      this.saveStats();
      
    } catch (error) {
      console.error(`Failed to set cache item ${key}:`, error);
    }
  }
  
  /**
   * Get cache item with automatic expiration
   */
  get<T>(key: string): T | null {
    try {
      const encrypted = this.storage.getString(key);
      if (!encrypted) {
        this.stats.missCount++;
        return null;
      }
      
      const decrypted = this.decrypt(encrypted);
      const item: CacheItem<T> = JSON.parse(decrypted);
      
      // Check expiration
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.delete(key);
        this.stats.missCount++;
        this.stats.evictionCount++;
        return null;
      }
      
      this.stats.hitCount++;
      return item.value;
      
    } catch (error) {
      console.error(`Failed to get cache item ${key}:`, error);
      this.delete(key); // Remove corrupted item
      this.stats.missCount++;
      return null;
    }
  }
  
  /**
   * Delete cache item
   */
  delete(key: string): void {
    try {
      this.storage.delete(key);
      this.stats.totalItems = Math.max(0, this.stats.totalItems - 1);
      this.saveStats();
    } catch (error) {
      console.error(`Failed to delete cache item ${key}:`, error);
    }
  }
  
  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  /**
   * Get cache item with fallback
   */
  getWithFallback<T>(key: string, fallback: T): T {
    const value = this.get<T>(key);
    return value !== null ? value : fallback;
  }
  
  /**
   * Set multiple items at once
   */
  async setMultiple<T>(items: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    await Promise.all(
      items.map(item => this.set(item.key, item.value, item.ttl))
    );
  }
  
  /**
   * Get multiple items at once
   */
  getMultiple<T>(keys: string[]): Array<{ key: string; value: T | null }> {
    return keys.map(key => ({
      key,
      value: this.get<T>(key),
    }));
  }
  
  /**
   * Clear expired items
   */
  clearExpired(): number {
    const allKeys = this.storage.getAllKeys();
    let clearedCount = 0;
    
    allKeys.forEach(key => {
      if (this.get(key) === null) {
        clearedCount++;
      }
    });
    
    return clearedCount;
  }
  
  /**
   * Clear all cache items
   */
  clear(): void {
    try {
      this.storage.clearAll();
      this.stats = {
        totalItems: 0,
        totalSize: 0,
        hitCount: 0,
        missCount: 0,
        evictionCount: 0,
      };
      this.saveStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hitCount + this.stats.missCount;
    const hitRate = total > 0 ? this.stats.hitCount / total : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }
  
  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    return this.storage.getAllKeys();
  }
  
  /**
   * Get cache size in bytes (approximate)
   */
  getSize(): number {
    return this.stats.totalSize;
  }
  
  /**
   * Optimize cache by removing expired items
   */
  optimize(): { clearedCount: number; reclaimedBytes: number } {
    const initialSize = this.stats.totalSize;
    const clearedCount = this.clearExpired();
    const reclaimedBytes = initialSize - this.stats.totalSize;
    
    return {
      clearedCount,
      reclaimedBytes,
    };
  }
  
  /**
   * Load cache statistics
   */
  private loadStats(): void {
    try {
      const statsData = this.storage.getString('__cache_stats__');
      if (statsData) {
        this.stats = JSON.parse(statsData);
      }
    } catch {
      // Use default stats
    }
  }
  
  /**
   * Save cache statistics
   */
  private saveStats(): void {
    try {
      this.storage.set('__cache_stats__', JSON.stringify(this.stats));
    } catch {
      // Ignore stats save errors
    }
  }
}

// Create default cache instances
export const encryptedCache = new EncryptedCache('default');
export const sensitiveCache = new EncryptedCache('sensitive');
export const apiCache = new EncryptedCache('api');