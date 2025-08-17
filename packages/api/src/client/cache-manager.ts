import { MMKV } from 'react-native-mmkv';
import * as pako from 'pako';
import type { CachedData, CacheConfig } from './types/offline.types';

/**
 * Enhanced cache manager with compression, TTL, and size management
 */
export class CacheManager {
  private storage: MMKV;
  private metaStorage: MMKV;
  private config: CacheConfig;
  private readonly MAX_CACHE_SIZE: number; // MB
  private readonly COMPRESSION_THRESHOLD: number; // bytes

  constructor(config: CacheConfig = {}) {
    this.config = config;
    this.MAX_CACHE_SIZE = config.maxSize || 50; // 50MB default
    this.COMPRESSION_THRESHOLD = config.compressionThreshold || 1024; // 1KB default

    // Main storage for cached data
    this.storage = new MMKV({
      id: 'api-cache',
      encryptionKey: config.encryptionKey || this.generateEncryptionKey(),
    });

    // Metadata storage for cache management
    this.metaStorage = new MMKV({
      id: 'api-cache-meta',
      encryptionKey: config.encryptionKey || this.generateEncryptionKey(),
    });

    // Initialize cache maintenance
    this.initializeMaintenance();
  }

  /**
   * Get cached data
   */
  async get<T = any>(key: string): Promise<CachedData | null> {
    try {
      const meta = this.getMetadata(key);
      if (!meta) return null;

      // Check if expired
      const now = Date.now();
      if (now > meta.timestamp + (meta.ttl * 1000)) {
        await this.delete(key);
        return null;
      }

      // Get data
      const rawData = this.storage.getString(key);
      if (!rawData) return null;

      let data: T;
      
      // Decompress if needed
      if (meta.compressed) {
        const compressed = Uint8Array.from(JSON.parse(rawData));
        const decompressed = pako.inflate(compressed, { to: 'string' });
        data = JSON.parse(decompressed);
      } else {
        data = JSON.parse(rawData);
      }

      // Update access metadata
      this.updateAccessMetadata(key, meta);

      return {
        data,
        timestamp: meta.timestamp,
        ttl: meta.ttl,
        etag: meta.etag,
        compressed: meta.compressed,
        size: meta.size,
        accessCount: (meta.accessCount || 0) + 1,
        lastAccessed: now,
      };
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data with smart compression
   */
  async set<T = any>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      const size = serialized.length;
      
      // Check if we need to make space
      const currentSize = await this.getSize();
      if (currentSize + size / (1024 * 1024) > this.MAX_CACHE_SIZE) {
        await this.prune();
      }

      let finalData: string;
      let compressed = false;

      // Compress if over threshold
      if (size > this.COMPRESSION_THRESHOLD) {
        try {
          const compressedData = pako.deflate(serialized);
          finalData = JSON.stringify(Array.from(compressedData));
          compressed = true;
        } catch {
          finalData = serialized;
        }
      } else {
        finalData = serialized;
      }

      // Store data
      this.storage.set(key, finalData);

      // Store metadata
      const metadata = {
        timestamp: Date.now(),
        ttl: ttl || this.getEndpointTTL(key) || 3600,
        size: finalData.length,
        compressed,
        accessCount: 0,
        lastAccessed: Date.now(),
      };

      this.setMetadata(key, metadata);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete cached entry
   */
  async delete(key: string): Promise<void> {
    this.storage.delete(key);
    this.metaStorage.delete(`meta:${key}`);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.storage.clearAll();
    this.metaStorage.clearAll();
  }

  /**
   * Invalidate cache entries matching pattern
   */
  async invalidate(pattern: string): Promise<void> {
    const keys = this.storage.getAllKeys();
    const regex = new RegExp(pattern);
    
    for (const key of keys) {
      if (regex.test(key)) {
        await this.delete(key);
      }
    }
  }

  /**
   * Get total cache size in MB
   */
  async getSize(): Promise<number> {
    const keys = this.metaStorage.getAllKeys();
    let totalSize = 0;

    for (const key of keys) {
      if (key.startsWith('meta:')) {
        const meta = this.getMetadata(key.replace('meta:', ''));
        if (meta) {
          totalSize += meta.size || 0;
        }
      }
    }

    return totalSize / (1024 * 1024); // Convert to MB
  }

  /**
   * Prune old/least used entries
   */
  async prune(): Promise<void> {
    const entries: Array<{
      key: string;
      meta: any;
      score: number;
    }> = [];

    const keys = this.metaStorage.getAllKeys();
    const now = Date.now();

    // Calculate scores for all entries
    for (const key of keys) {
      if (key.startsWith('meta:')) {
        const actualKey = key.replace('meta:', '');
        const meta = this.getMetadata(actualKey);
        
        if (meta) {
          // Score based on: age, access frequency, and size
          const age = now - meta.timestamp;
          const lastAccess = now - (meta.lastAccessed || meta.timestamp);
          const accessRate = (meta.accessCount || 0) / (age / 3600000); // accesses per hour
          
          // Lower score = more likely to be pruned
          const score = accessRate * 1000 - lastAccess / 1000 - (meta.size || 0) / 10000;
          
          entries.push({
            key: actualKey,
            meta,
            score,
          });
        }
      }
    }

    // Sort by score (ascending - lowest scores pruned first)
    entries.sort((a, b) => a.score - b.score);

    // Remove entries until we're under 80% of max size
    const targetSize = this.MAX_CACHE_SIZE * 0.8;
    let currentSize = await this.getSize();

    for (const entry of entries) {
      if (currentSize <= targetSize) break;
      
      await this.delete(entry.key);
      currentSize -= (entry.meta.size || 0) / (1024 * 1024);
    }
  }

  /**
   * Warm cache with pre-fetched data
   */
  async warm(entries: Array<{ key: string; data: any; ttl?: number }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.data, entry.ttl);
    }
  }

  /**
   * Check if cache has key
   */
  async has(key: string): Promise<boolean> {
    const meta = this.getMetadata(key);
    if (!meta) return false;

    // Check if expired
    const now = Date.now();
    if (now > meta.timestamp + (meta.ttl * 1000)) {
      await this.delete(key);
      return false;
    }

    return this.storage.contains(key);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    entries: number;
    size: number;
    hitRate: number;
    avgAccessCount: number;
  }> {
    const keys = this.metaStorage.getAllKeys();
    let totalEntries = 0;
    let totalAccesses = 0;
    let totalHits = 0;

    for (const key of keys) {
      if (key.startsWith('meta:')) {
        totalEntries++;
        const meta = this.metaStorage.getString(key);
        if (meta) {
          const parsed = JSON.parse(meta);
          totalAccesses += parsed.accessCount || 0;
          if (parsed.accessCount > 0) totalHits++;
        }
      }
    }

    return {
      entries: totalEntries,
      size: await this.getSize(),
      hitRate: totalEntries > 0 ? totalHits / totalEntries : 0,
      avgAccessCount: totalEntries > 0 ? totalAccesses / totalEntries : 0,
    };
  }

  // Private helper methods

  private generateEncryptionKey(): string {
    // In production, this should be generated once and stored securely
    return 'generated-encryption-key-' + Date.now();
  }

  private getMetadata(key: string): any {
    const meta = this.metaStorage.getString(`meta:${key}`);
    return meta ? JSON.parse(meta) : null;
  }

  private setMetadata(key: string, metadata: any): void {
    this.metaStorage.set(`meta:${key}`, JSON.stringify(metadata));
  }

  private updateAccessMetadata(key: string, meta: any): void {
    meta.accessCount = (meta.accessCount || 0) + 1;
    meta.lastAccessed = Date.now();
    this.setMetadata(key, meta);
  }

  private getEndpointTTL(key: string): number | undefined {
    if (!this.config.ttlByEndpoint) return undefined;

    // Extract endpoint from cache key
    const parts = key.split(':');
    if (parts.length >= 2) {
      const endpoint = parts[1];
      
      // Check for exact match
      if (this.config.ttlByEndpoint[endpoint]) {
        return this.config.ttlByEndpoint[endpoint];
      }
      
      // Check for pattern match
      for (const [pattern, ttl] of Object.entries(this.config.ttlByEndpoint)) {
        if (endpoint.includes(pattern) || new RegExp(pattern).test(endpoint)) {
          return ttl;
        }
      }
    }

    return undefined;
  }

  private initializeMaintenance(): void {
    // Run maintenance every 5 minutes
    setInterval(async () => {
      const size = await this.getSize();
      if (size > this.MAX_CACHE_SIZE * 0.9) {
        await this.prune();
      }
    }, 5 * 60 * 1000);

    // Clean expired entries every hour
    setInterval(async () => {
      const keys = this.metaStorage.getAllKeys();
      const now = Date.now();

      for (const key of keys) {
        if (key.startsWith('meta:')) {
          const actualKey = key.replace('meta:', '');
          const meta = this.getMetadata(actualKey);
          
          if (meta && now > meta.timestamp + (meta.ttl * 1000)) {
            await this.delete(actualKey);
          }
        }
      }
    }, 60 * 60 * 1000);
  }
}