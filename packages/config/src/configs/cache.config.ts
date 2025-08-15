import { EnvLoader } from '../env';
import type { CacheConfig } from '../types';

export function getCacheConfig(): CacheConfig {
  const env = EnvLoader.get();
  
  return {
    redisUrl: env.REDIS_URL,
    defaultTtl: env.CACHE_TTL,
    enabled: !!env.REDIS_URL,
  };
}

export function getRedisConfig() {
  const cacheConfig = getCacheConfig();
  const env = EnvLoader.get();
  
  if (!cacheConfig.redisUrl) {
    return null;
  }
  
  const url = new URL(cacheConfig.redisUrl);
  
  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
    db: parseInt(url.pathname.slice(1)) || 0,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    keyPrefix: `startynk:${env.NODE_ENV}:`,
    // Connection pool settings
    family: 4, // IPv4
    // TLS settings for production
    ...(env.isProduction && {
      tls: {},
    }),
  };
}

export function getCacheStrategy() {
  const env = EnvLoader.get();
  
  return {
    // User sessions
    userSession: {
      ttl: 24 * 60 * 60, // 24 hours
      key: (userId: string) => `user:session:${userId}`,
    },
    
    // API responses
    apiResponse: {
      ttl: 5 * 60, // 5 minutes
      key: (endpoint: string, params?: string) => `api:${endpoint}${params ? `:${params}` : ''}`,
    },
    
    // Database queries
    dbQuery: {
      ttl: 15 * 60, // 15 minutes
      key: (table: string, query: string) => `db:${table}:${query}`,
    },
    
    // Feature flags
    featureFlags: {
      ttl: 60 * 60, // 1 hour
      key: () => 'features',
    },
    
    // Rate limiting
    rateLimit: {
      ttl: 15 * 60, // 15 minutes (match rate limit window)
      key: (ip: string) => `rate:${ip}`,
    },
    
    // File uploads
    uploads: {
      ttl: 7 * 24 * 60 * 60, // 7 days
      key: (uploadId: string) => `upload:${uploadId}`,
    },
    
    // Email verification tokens
    emailTokens: {
      ttl: 60 * 60, // 1 hour
      key: (email: string, type: string) => `email:${type}:${email}`,
    },
    
    // Password reset tokens
    passwordReset: {
      ttl: 30 * 60, // 30 minutes
      key: (userId: string) => `pwd:reset:${userId}`,
    },
  };
}