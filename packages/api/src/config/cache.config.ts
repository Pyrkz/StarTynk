/**
 * Cache configuration for intelligent mobile client caching
 * Provides different cache strategies based on client type and endpoint
 */

import type { ClientType } from '../services/client-detection.service';

export type CacheStrategy = 'STATIC' | 'DYNAMIC' | 'PRIVATE' | 'COLLECTION' | 'NONE';

export interface CacheOptions {
  maxAge: number; // seconds
  swr?: number; // stale-while-revalidate seconds
  private?: boolean;
  immutable?: boolean;
  mustRevalidate?: boolean;
}

export interface CacheStrategyConfig {
  mobile: CacheOptions;
  web: CacheOptions;
}

/**
 * Cache strategies for different types of data
 * Mobile clients get more aggressive caching due to network constraints
 */
export const CACHE_STRATEGIES: Record<CacheStrategy, CacheStrategyConfig> = {
  // Static data (users, projects metadata)
  STATIC: {
    mobile: { 
      maxAge: 86400, // 1 day
      swr: 604800 // stale for 1 week
    },
    web: { 
      maxAge: 3600, // 1 hour
      swr: 7200 // stale for 2 hours
    }
  },
  
  // Dynamic data (task updates, real-time data)
  DYNAMIC: {
    mobile: { 
      maxAge: 300, // 5 min
      swr: 600 // stale for 10 min
    },
    web: { 
      maxAge: 60, // 1 min
      swr: 120 // stale for 2 min
    }
  },
  
  // User-specific data
  PRIVATE: {
    mobile: { 
      maxAge: 1800, // 30 min
      private: true 
    },
    web: { 
      maxAge: 0, // No cache
      private: true 
    }
  },
  
  // Lists and collections
  COLLECTION: {
    mobile: { 
      maxAge: 600, // 10 min
      swr: 1800 // stale for 30 min
    },
    web: { 
      maxAge: 180, // 3 min
      swr: 360 // stale for 6 min
    }
  },
  
  // No caching
  NONE: {
    mobile: { 
      maxAge: 0,
      private: true,
      mustRevalidate: true
    },
    web: { 
      maxAge: 0,
      private: true,
      mustRevalidate: true
    }
  }
};

/**
 * Generate Cache-Control header based on options
 */
export function generateCacheControlHeader(options: CacheOptions): string {
  const directives: string[] = [];
  
  if (options.private) {
    directives.push('private');
  } else {
    directives.push('public');
  }
  
  if (options.maxAge >= 0) {
    directives.push(`max-age=${options.maxAge}`);
  }
  
  if (options.swr) {
    directives.push(`stale-while-revalidate=${options.swr}`);
  }
  
  if (options.immutable) {
    directives.push('immutable');
  }
  
  if (options.mustRevalidate) {
    directives.push('must-revalidate');
  }
  
  return directives.join(', ');
}

/**
 * Generate CDN-Cache-Control header for edge caching
 * More aggressive caching at CDN level
 */
export function generateCDNCacheControlHeader(options: CacheOptions): string {
  const cdnMaxAge = options.maxAge * 4; // CDN caches 4x longer
  return `max-age=${cdnMaxAge}`;
}

/**
 * Cache key generation helpers
 */
export const CacheKeyGenerators = {
  /**
   * Generate cache key for API endpoints
   */
  api: (method: string, path: string, params?: Record<string, any>): string => {
    const sortedParams = params ? 
      Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&') : '';
    
    return `api:${method}:${path}${sortedParams ? `?${sortedParams}` : ''}`;
  },
  
  /**
   * Generate cache key for user-specific data
   */
  user: (userId: string, resource: string): string => {
    return `user:${userId}:${resource}`;
  },
  
  /**
   * Generate cache key for collections
   */
  collection: (resource: string, filters?: Record<string, any>): string => {
    const filterKey = filters ? 
      ':' + Object.keys(filters)
        .sort()
        .map(key => `${key}=${filters[key]}`)
        .join(':') : '';
    
    return `collection:${resource}${filterKey}`;
  }
};

/**
 * Cache tag generators for invalidation
 */
export const CacheTagGenerators = {
  project: (projectId: string) => `project:${projectId}`,
  user: (userId: string) => `user:${userId}`,
  task: (taskId: string) => `task:${taskId}`,
  employee: (employeeId: string) => `employee:${employeeId}`,
  vehicle: (vehicleId: string) => `vehicle:${vehicleId}`,
  equipment: (equipmentId: string) => `equipment:${equipmentId}`,
  all: (resource: string) => `all:${resource}`
};

export interface PerformanceHints {
  compressionThreshold: number;
  maxResponseSize: number;
  preferredFormats: string[];
  enableFieldFiltering: boolean;
  defaultPageSize: number;
  maxPageSize: number;
}

/**
 * Performance hints for different client types
 */
export const PERFORMANCE_HINTS: Record<ClientType, PerformanceHints> = {
  mobile: {
    // Compress responses over this size
    compressionThreshold: 1024, // 1KB
    // Maximum response size before warning
    maxResponseSize: 512 * 1024, // 512KB
    // Prefer these formats for data
    preferredFormats: ['json', 'messagepack'],
    // Enable field filtering
    enableFieldFiltering: true,
    // Default pagination size
    defaultPageSize: 20,
    // Maximum items in a single response
    maxPageSize: 50
  },
  web: {
    compressionThreshold: 4096, // 4KB
    maxResponseSize: 2 * 1024 * 1024, // 2MB
    preferredFormats: ['json'],
    enableFieldFiltering: false,
    defaultPageSize: 50,
    maxPageSize: 100
  },
  unknown: {
    // Unknown clients default to web behavior
    compressionThreshold: 4096, // 4KB
    maxResponseSize: 2 * 1024 * 1024, // 2MB
    preferredFormats: ['json'],
    enableFieldFiltering: false,
    defaultPageSize: 50,
    maxPageSize: 100
  }
};

/**
 * Network quality detection thresholds
 */
export const NETWORK_QUALITY_THRESHOLDS = {
  // Based on Save-Data header or network type
  slow: {
    maxAge: 7200, // 2 hours
    swr: 86400, // 1 day
    compressionLevel: 9
  },
  fast: {
    maxAge: 600, // 10 minutes
    swr: 1800, // 30 minutes
    compressionLevel: 6
  },
  offline: {
    maxAge: 604800, // 1 week
    swr: 2592000, // 30 days
    compressionLevel: 9
  }
};