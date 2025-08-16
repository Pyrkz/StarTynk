import { QueryClient } from '@tanstack/react-query';
import { LRUCache } from 'lru-cache';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { prisma } from '@repo/database';

const compress = promisify(zlib.gzip);
const decompress = promisify(zlib.gunzip);

export interface CacheConfig {
  entityType: string;
  strategy: 'NETWORK_FIRST' | 'CACHE_FIRST' | 'CACHE_ONLY' | 'NETWORK_ONLY' | 'STALE_WHILE_REVALIDATE';
  ttl: number; // Time to live in seconds
  staleTime: number; // Time before data is considered stale
  maxSize: number; // Max items in cache
  compress: boolean; // Compress cached data
  priority: number; // Cache priority (1-10)
}

export class CacheStrategyManager {
  private strategies: Map<string, CacheConfig> = new Map();
  private memoryCache: LRUCache<string, any>;
  private persistentCache: Map<string, any> = new Map();
  private hitCount = 0;
  private missCount = 0;
  
  constructor() {
    this.memoryCache = new LRUCache({
      max: 500, // Max 500 items
      maxSize: 50 * 1024 * 1024, // 50MB
      sizeCalculation: (value) => {
        try {
          return JSON.stringify(value).length;
        } catch {
          return 1024; // Default 1KB if serialization fails
        }
      },
      ttl: 1000 * 60 * 5, // 5 minutes default
      updateAgeOnGet: true,
      updateAgeOnHas: true,
      dispose: (value, key) => {
        console.log(`Cache evicted: ${key}`);
      },
    });
    
    this.initializeStrategies();
    this.loadPoliciesFromDB();
  }
  
  private initializeStrategies(): void {
    // Define cache strategies per entity type
    const configs: CacheConfig[] = [
      {
        entityType: 'user',
        strategy: 'CACHE_FIRST',
        ttl: 3600, // 1 hour
        staleTime: 1800, // 30 minutes
        maxSize: 100,
        compress: false,
        priority: 10,
      },
      {
        entityType: 'project',
        strategy: 'STALE_WHILE_REVALIDATE',
        ttl: 1800, // 30 minutes
        staleTime: 300, // 5 minutes
        maxSize: 50,
        compress: true,
        priority: 8,
      },
      {
        entityType: 'attendance',
        strategy: 'NETWORK_FIRST',
        ttl: 300, // 5 minutes
        staleTime: 60, // 1 minute
        maxSize: 200,
        compress: false,
        priority: 9,
      },
      {
        entityType: 'task',
        strategy: 'CACHE_FIRST',
        ttl: 900, // 15 minutes
        staleTime: 300, // 5 minutes
        maxSize: 100,
        compress: true,
        priority: 7,
      },
      {
        entityType: 'payroll',
        strategy: 'NETWORK_FIRST',
        ttl: 60, // 1 minute - critical data
        staleTime: 30,
        maxSize: 50,
        compress: false,
        priority: 10,
      },
      {
        entityType: 'notification',
        strategy: 'CACHE_FIRST',
        ttl: 600, // 10 minutes
        staleTime: 120, // 2 minutes
        maxSize: 100,
        compress: false,
        priority: 6,
      },
      {
        entityType: 'material',
        strategy: 'CACHE_FIRST',
        ttl: 3600, // 1 hour
        staleTime: 900, // 15 minutes
        maxSize: 200,
        compress: true,
        priority: 5,
      },
    ];
    
    configs.forEach(config => {
      this.strategies.set(config.entityType, config);
    });
  }
  
  private async loadPoliciesFromDB(): Promise<void> {
    try {
      const policies = await prisma.cachePolicy.findMany({
        where: { isActive: true },
      });
      
      policies.forEach(policy => {
        this.strategies.set(policy.entityType, {
          entityType: policy.entityType,
          strategy: policy.strategy as any,
          ttl: policy.ttl,
          staleTime: policy.staleTime,
          maxSize: 100, // Default
          compress: policy.priority >= 7, // Compress high priority data
          priority: policy.priority,
        });
      });
    } catch (error) {
      console.error('Failed to load cache policies from DB:', error);
    }
  }
  
  getStrategy(entityType: string): CacheConfig {
    return this.strategies.get(entityType) || {
      entityType,
      strategy: 'NETWORK_FIRST',
      ttl: 300,
      staleTime: 60,
      maxSize: 100,
      compress: false,
      priority: 5,
    };
  }
  
  async get(key: string, entityType: string): Promise<any | null> {
    const strategy = this.getStrategy(entityType);
    
    // Check memory cache first
    const memCached = this.memoryCache.get(key);
    if (memCached) {
      this.hitCount++;
      return memCached;
    }
    
    // Check persistent cache
    const persisted = this.persistentCache.get(key);
    if (persisted) {
      let data = persisted.data;
      
      // Decompress if needed
      if (strategy.compress && persisted.compressed) {
        data = JSON.parse((await decompress(Buffer.from(data, 'base64'))).toString());
      }
      
      // Check if expired
      if (Date.now() - persisted.timestamp < strategy.ttl * 1000) {
        // Restore to memory cache
        this.memoryCache.set(key, data, {
          ttl: strategy.ttl * 1000,
        });
        this.hitCount++;
        return data;
      }
    }
    
    this.missCount++;
    return null;
  }
  
  async set(key: string, value: any, entityType: string): Promise<void> {
    const strategy = this.getStrategy(entityType);
    
    // Store in memory cache
    this.memoryCache.set(key, value, {
      ttl: strategy.ttl * 1000,
    });
    
    // Prepare for persistent storage
    let dataToStore = value;
    let compressed = false;
    
    if (strategy.compress) {
      const json = JSON.stringify(value);
      if (json.length > 1024) { // Only compress if > 1KB
        dataToStore = (await compress(Buffer.from(json))).toString('base64');
        compressed = true;
      }
    }
    
    // Store persistently
    this.persistentCache.set(key, {
      data: dataToStore,
      timestamp: Date.now(),
      compressed,
      entityType,
    });
    
    // Limit persistent cache size
    if (this.persistentCache.size > 1000) {
      // Remove oldest entries
      const entries = Array.from(this.persistentCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      for (let i = 0; i < 100; i++) {
        this.persistentCache.delete(entries[i][0]);
      }
    }
  }
  
  invalidate(pattern: string): void {
    // Invalidate matching keys
    const regex = new RegExp(pattern);
    
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clear from persistent cache
    for (const key of this.persistentCache.keys()) {
      if (regex.test(key)) {
        this.persistentCache.delete(key);
      }
    }
  }
  
  invalidateEntity(entityType: string, entityId?: string): void {
    if (entityId) {
      this.invalidate(`^${entityType}:${entityId}`);
    } else {
      this.invalidate(`^${entityType}:`);
    }
  }
  
  // Preload critical data
  async preload(entities: string[]): Promise<void> {
    for (const entity of entities) {
      const strategy = this.getStrategy(entity);
      if (strategy.priority >= 8) {
        // Preload high priority entities
        await this.preloadEntity(entity);
      }
    }
  }
  
  private async preloadEntity(entityType: string): Promise<void> {
    // Implementation depends on entity type
    console.log(`Preloading ${entityType} data...`);
    
    // Example: Preload user data
    if (entityType === 'user') {
      // Preload current user data
      // This would be implemented based on your auth system
    }
  }
  
  // Get cache statistics
  getStats(): {
    memorySize: number;
    memoryCount: number;
    persistentCount: number;
    hitRate: number;
    hitCount: number;
    missCount: number;
  } {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? this.hitCount / total : 0;
    
    return {
      memorySize: this.memoryCache.calculatedSize || 0,
      memoryCount: this.memoryCache.size,
      persistentCount: this.persistentCache.size,
      hitRate,
      hitCount: this.hitCount,
      missCount: this.missCount,
    };
  }
  
  clear(): void {
    this.memoryCache.clear();
    this.persistentCache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
}

// React Query integration
export function createQueryClient(cacheManager: CacheStrategyManager): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Custom query function that integrates with cache strategy
        queryFn: async ({ queryKey, meta }: any) => {
          const entityType = meta?.entityType || 'default';
          const strategy = cacheManager.getStrategy(entityType);
          const cacheKey = Array.isArray(queryKey) ? queryKey.join(':') : String(queryKey);
          
          // Apply strategy
          switch (strategy.strategy) {
            case 'CACHE_FIRST': {
              const cached = await cacheManager.get(cacheKey, entityType);
              if (cached) return cached;
              break;
            }
              
            case 'CACHE_ONLY': {
              const cacheOnly = await cacheManager.get(cacheKey, entityType);
              if (cacheOnly) return cacheOnly;
              throw new Error('No cached data available');
            }
              
            case 'STALE_WHILE_REVALIDATE': {
              const stale = await cacheManager.get(cacheKey, entityType);
              if (stale) {
                // Return stale data immediately
                setTimeout(() => {
                  // Revalidate in background
                  // This will be handled by the actual query function
                }, 0);
                return stale;
              }
              break;
            }
            
            case 'NETWORK_ONLY':
              // Skip cache entirely
              break;
          }
          
          // Network fetch will be handled by the actual query function
          return null;
        },
        
        staleTime: (query: any) => {
          const entityType = query.meta?.entityType || 'default';
          const strategy = cacheManager.getStrategy(entityType);
          return strategy.staleTime * 1000;
        },
        
        cacheTime: (query: any) => {
          const entityType = query.meta?.entityType || 'default';
          const strategy = cacheManager.getStrategy(entityType);
          return strategy.ttl * 1000;
        },
        
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false;
          }
          return failureCount < 3;
        },
        
        onSuccess: async (data: any, query: any) => {
          // Store successful responses in cache
          const entityType = query.meta?.entityType || 'default';
          const cacheKey = Array.isArray(query.queryKey) 
            ? query.queryKey.join(':') 
            : String(query.queryKey);
          
          await cacheManager.set(cacheKey, data, entityType);
        },
      },
      
      mutations: {
        onSuccess: (data, variables, context, mutation) => {
          // Invalidate related caches on mutation success
          const entityType = mutation.meta?.entityType;
          if (entityType) {
            cacheManager.invalidateEntity(entityType);
          }
        },
      },
    },
  });
}

// Export singleton instance
export const cacheManager = new CacheStrategyManager();