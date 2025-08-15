import { QueryClient } from '@tanstack/react-query';

export interface CacheStrategy {
  staleTime?: number;
  gcTime?: number;
  refetchInterval?: number | false;
  refetchOnMount?: boolean | 'always';
  refetchOnWindowFocus?: boolean | 'always';
  refetchOnReconnect?: boolean | 'always';
}

// Predefined cache strategies
export const cacheStrategies: Record<string, CacheStrategy> = {
  // Real-time data (always fresh)
  realtime: {
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10000, // 10 seconds
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  },

  // Frequently updated (1 minute stale)
  frequent: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  // Standard caching (5 minutes stale)
  standard: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  // Long cache (30 minutes stale)
  long: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  // Static data (1 hour stale)
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  // Infinite cache (never stale)
  infinite: {
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
};

// Entity-based cache invalidation mapping
export const entityInvalidationMap: Record<string, string[][]> = {
  users: [
    ['users'], // Main users list
    ['users', 'list'], // Paginated users list
    ['users', 'count'], // Users count
    ['users', 'statistics'], // User statistics
  ],
  projects: [
    ['projects'],
    ['projects', 'list'],
    ['projects', 'count'],
    ['projects', 'statistics'],
    ['users', 'projects'], // Related user projects
  ],
  equipment: [
    ['equipment'],
    ['equipment', 'list'],
    ['equipment', 'categories'],
    ['equipment', 'assignments'],
    ['users', 'equipment'], // Related user equipment
  ],
  vehicles: [
    ['vehicles'],
    ['vehicles', 'list'],
    ['vehicles', 'statistics'],
    ['vehicles', 'costs'],
  ],
};

// Smart cache invalidation
export class SmartCacheInvalidator {
  constructor(private queryClient: QueryClient) {}

  // Invalidate related queries based on mutation
  invalidateRelated(mutationType: 'create' | 'update' | 'delete', entityType: string, entityId?: string) {
    const invalidations: string[][] = [];

    switch (mutationType) {
      case 'create':
        // Invalidate lists and counts
        invalidations.push([entityType]);
        invalidations.push([entityType, 'list']);
        invalidations.push([entityType, 'count']);
        invalidations.push([entityType, 'statistics']);
        break;

      case 'update':
        // Invalidate specific entity and lists
        if (entityId) {
          invalidations.push([entityType, entityId]);
          invalidations.push([entityType, entityId, 'details']);
        }
        invalidations.push([entityType]);
        invalidations.push([entityType, 'list']);
        invalidations.push([entityType, 'statistics']);
        break;

      case 'delete':
        // Invalidate everything related
        if (entityId) {
          this.queryClient.removeQueries({ queryKey: [entityType, entityId] });
        }
        invalidations.push([entityType]);
        invalidations.push([entityType, 'list']);
        invalidations.push([entityType, 'count']);
        invalidations.push([entityType, 'statistics']);
        break;
    }

    // Add entity-specific invalidations
    const entityInvalidations = entityInvalidationMap[entityType];
    if (entityInvalidations) {
      invalidations.push(...entityInvalidations);
    }

    // Execute invalidations
    invalidations.forEach(queryKey => {
      this.queryClient.invalidateQueries({ queryKey });
    });

    console.log(`Cache invalidation: ${mutationType} ${entityType}${entityId ? ` (${entityId})` : ''}`);
    console.log(`Invalidated ${invalidations.length} query patterns`);
  }

  // Selective invalidation based on query patterns
  invalidateByPattern(pattern: RegExp | string) {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    let invalidatedCount = 0;
    
    queries.forEach(query => {
      const queryKeyString = query.queryKey.join(':');
      const shouldInvalidate = typeof pattern === 'string' 
        ? queryKeyString.includes(pattern)
        : pattern.test(queryKeyString);
        
      if (shouldInvalidate) {
        this.queryClient.invalidateQueries({ queryKey: query.queryKey });
        invalidatedCount++;
      }
    });

    console.log(`Pattern invalidation: ${pattern.toString()} - ${invalidatedCount} queries invalidated`);
  }

  // Time-based invalidation
  invalidateStaleQueries(maxAge: number = 30 * 60 * 1000) { // 30 minutes default
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const now = Date.now();
    let invalidatedCount = 0;
    
    queries.forEach(query => {
      const lastUpdated = query.state.dataUpdatedAt || 0;
      const age = now - lastUpdated;
      
      if (age > maxAge) {
        this.queryClient.invalidateQueries({ queryKey: query.queryKey });
        invalidatedCount++;
      }
    });

    console.log(`Time-based invalidation: ${invalidatedCount} stale queries invalidated`);
  }

  // Prefetch related data after mutations
  async prefetchRelated(entityType: string, entityId: string) {
    const prefetches = [];

    // Prefetch entity details
    prefetches.push(
      this.queryClient.prefetchQuery({
        queryKey: [entityType, entityId],
        queryFn: async () => {
          // This would be replaced with actual API call
          const response = await fetch(`/api/${entityType}/${entityId}`);
          return response.json();
        },
        staleTime: cacheStrategies.standard.staleTime,
      })
    );

    // Prefetch related data based on entity type
    switch (entityType) {
      case 'users':
        prefetches.push(
          this.queryClient.prefetchQuery({
            queryKey: ['users', entityId, 'projects'],
            queryFn: async () => {
              const response = await fetch(`/api/users/${entityId}/projects`);
              return response.json();
            },
          })
        );
        break;
        
      case 'projects':
        prefetches.push(
          this.queryClient.prefetchQuery({
            queryKey: ['projects', entityId, 'tasks'],
            queryFn: async () => {
              const response = await fetch(`/api/projects/${entityId}/tasks`);
              return response.json();
            },
          })
        );
        break;
    }

    try {
      await Promise.all(prefetches);
      console.log(`Prefetched related data for ${entityType}:${entityId}`);
    } catch (error) {
      console.warn(`Failed to prefetch related data for ${entityType}:${entityId}:`, error);
    }
  }

  // Garbage collection for old cache entries
  cleanupCache(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours default
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const now = Date.now();
    let removedCount = 0;

    queries.forEach(query => {
      const lastUpdated = query.state.dataUpdatedAt || 0;
      const age = now - lastUpdated;

      // Remove if old and not actively observed
      if (age > maxAge && query.getObserversCount() === 0) {
        cache.remove(query);
        removedCount++;
      }
    });

    console.log(`Cache cleanup: removed ${removedCount} stale entries`);
    return removedCount;
  }

  // Get cache statistics
  getCacheStats() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'loading').length,
      successQueries: queries.filter(q => q.state.status === 'success').length,
      memoryUsage: this.estimateMemoryUsage(),
    };

    return stats;
  }

  // Estimate cache memory usage
  private estimateMemoryUsage(): number {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    let estimatedSize = 0;
    
    queries.forEach(query => {
      if (query.state.data) {
        try {
          // Rough estimation using JSON serialization
          const serialized = JSON.stringify(query.state.data);
          estimatedSize += serialized.length * 2; // Rough estimate for UTF-16
        } catch {
          // If data can't be serialized, estimate as 1KB
          estimatedSize += 1024;
        }
      }
    });

    return estimatedSize / (1024 * 1024); // Return in MB
  }

  // Intelligent cache warming
  async warmCache(entityTypes: string[]) {
    const warmupPromises = entityTypes.map(async (entityType) => {
      try {
        await this.queryClient.prefetchQuery({
          queryKey: [entityType, 'list'],
          queryFn: async () => {
            const response = await fetch(`/api/${entityType}`);
            return response.json();
          },
          staleTime: cacheStrategies.standard.staleTime,
        });
        
        console.log(`Cache warmed for ${entityType}`);
      } catch (error) {
        console.warn(`Failed to warm cache for ${entityType}:`, error);
      }
    });

    await Promise.allSettled(warmupPromises);
  }

  // Export cache for persistence (mobile)
  exportCache(): Record<string, any> {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const exportData: Record<string, any> = {};
    
    queries.forEach(query => {
      if (query.state.status === 'success' && query.state.data) {
        const key = query.queryKey.join(':');
        exportData[key] = {
          data: query.state.data,
          dataUpdatedAt: query.state.dataUpdatedAt,
          staleTime: query.options.staleTime,
        };
      }
    });

    return exportData;
  }

  // Import cache from persistence (mobile)
  importCache(cacheData: Record<string, any>) {
    const now = Date.now();
    let importedCount = 0;

    Object.entries(cacheData).forEach(([key, value]) => {
      const { data, dataUpdatedAt, staleTime } = value;
      const queryKey = key.split(':');
      
      // Only import if not too old
      const age = now - dataUpdatedAt;
      if (staleTime && age < staleTime) {
        this.queryClient.setQueryData(queryKey, data);
        importedCount++;
      }
    });

    console.log(`Cache import: ${importedCount} entries restored`);
  }
}

// Utility to create cache invalidator
export function createCacheInvalidator(queryClient: QueryClient) {
  return new SmartCacheInvalidator(queryClient);
}

// Cache strategy selector based on data type
export function selectCacheStrategy(dataType: string): CacheStrategy {
  const strategyMap: Record<string, keyof typeof cacheStrategies> = {
    // Real-time data
    notifications: 'realtime',
    messages: 'realtime',
    online_status: 'realtime',
    
    // Frequently changing data
    dashboard: 'frequent',
    statistics: 'frequent',
    recent_activity: 'frequent',
    
    // Standard business data
    users: 'standard',
    projects: 'standard',
    equipment: 'standard',
    vehicles: 'standard',
    
    // Relatively stable data
    settings: 'long',
    configurations: 'long',
    categories: 'long',
    
    // Static reference data
    countries: 'static',
    currencies: 'static',
    timezones: 'static',
  };

  const strategyName = strategyMap[dataType] || 'standard';
  return cacheStrategies[strategyName];
}