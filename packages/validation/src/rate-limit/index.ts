import { RateLimitError } from '../errors';

export interface RateLimitConfig {
  points: number; // Number of requests
  duration: number; // Time window in seconds
  blockDuration?: number; // Block duration after limit exceeded
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export interface RateLimitStore {
  get(key: string): Promise<number | null>;
  set(key: string, value: number, ttl: number): Promise<void>;
  increment(key: string, increment: number, ttl: number): Promise<number>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// In-memory store for development
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { value: number; expiresAt: number }>();
  
  async get(key: string): Promise<number | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  async set(key: string, value: number, ttl: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }
  
  async increment(key: string, increment: number, ttl: number): Promise<number> {
    const current = await this.get(key) || 0;
    const newValue = current + increment;
    await this.set(key, newValue, ttl);
    return newValue;
  }
  
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }
  
  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.store.forEach((item, key) => {
      if (now > item.expiresAt) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.store.delete(key);
    });
  }
}

export class RateLimiter {
  private configs: Map<string, RateLimitConfig> = new Map();
  private store: RateLimitStore;
  
  constructor(store?: RateLimitStore) {
    this.store = store || new MemoryRateLimitStore();
    this.initializeConfigs();
  }
  
  private initializeConfigs(): void {
    // Authentication endpoints
    this.configs.set('auth:login', {
      points: 5,
      duration: 900, // 15 minutes
      blockDuration: 900,
    });
    
    this.configs.set('auth:register', {
      points: 3,
      duration: 3600, // 1 hour
      blockDuration: 3600,
    });
    
    this.configs.set('auth:reset-password', {
      points: 3,
      duration: 3600,
      blockDuration: 3600,
    });
    
    this.configs.set('auth:2fa', {
      points: 5,
      duration: 300, // 5 minutes
      blockDuration: 600,
    });
    
    // API endpoints
    this.configs.set('api:read', {
      points: 100,
      duration: 60, // Per minute
    });
    
    this.configs.set('api:write', {
      points: 30,
      duration: 60,
    });
    
    this.configs.set('api:upload', {
      points: 10,
      duration: 3600,
    });
    
    this.configs.set('api:export', {
      points: 5,
      duration: 3600,
    });
    
    // Admin endpoints
    this.configs.set('admin:bulk', {
      points: 10,
      duration: 3600,
    });
    
    this.configs.set('admin:delete', {
      points: 20,
      duration: 3600,
    });
  }
  
  addConfig(name: string, config: RateLimitConfig): void {
    this.configs.set(name, config);
  }
  
  async consume(
    key: string,
    points = 1,
    configName = 'api:read'
  ): Promise<RateLimitResult> {
    const config = this.configs.get(configName);
    if (!config) {
      throw new Error(`Rate limit config '${configName}' not found`);
    }
    
    const fullKey = `${config.keyPrefix || 'ratelimit'}:${configName}:${key}`;
    const blockKey = `${fullKey}:blocked`;
    
    // Check if blocked
    if (config.blockDuration) {
      const blocked = await this.store.exists(blockKey);
      if (blocked) {
        const ttl = config.blockDuration;
        throw new RateLimitError(ttl, config.points);
      }
    }
    
    // Get current usage
    const currentUsage = await this.store.get(fullKey) || 0;
    
    // Check if limit exceeded
    if (currentUsage + points > config.points) {
      // Block if configured
      if (config.blockDuration) {
        await this.store.set(blockKey, 1, config.blockDuration);
      }
      
      const resetAt = new Date(Date.now() + config.duration * 1000);
      throw new RateLimitError(config.duration, config.points);
    }
    
    // Consume points
    const newUsage = await this.store.increment(fullKey, points, config.duration);
    
    return {
      allowed: true,
      remaining: Math.max(0, config.points - newUsage),
      resetAt: new Date(Date.now() + config.duration * 1000),
    };
  }
  
  async isBlocked(key: string, configName: string): Promise<boolean> {
    const config = this.configs.get(configName);
    if (!config || !config.blockDuration) return false;
    
    const fullKey = `${config.keyPrefix || 'ratelimit'}:${configName}:${key}:blocked`;
    return this.store.exists(fullKey);
  }
  
  async reset(key: string, configName?: string): Promise<void> {
    if (configName) {
      const config = this.configs.get(configName);
      if (config) {
        const fullKey = `${config.keyPrefix || 'ratelimit'}:${configName}:${key}`;
        await this.store.delete(fullKey);
        await this.store.delete(`${fullKey}:blocked`);
      }
    } else {
      // Reset all limits for the key
      const configEntries: Array<[string, RateLimitConfig]> = [];
      this.configs.forEach((config, name) => {
        configEntries.push([name, config]);
      });
      
      for (const [name, config] of configEntries) {
        const fullKey = `${config.keyPrefix || 'ratelimit'}:${name}:${key}`;
        await this.store.delete(fullKey);
        await this.store.delete(`${fullKey}:blocked`);
      }
    }
  }
  
  async getUsage(key: string, configName: string): Promise<{
    used: number;
    limit: number;
    remaining: number;
    resetAt: Date;
  } | null> {
    const config = this.configs.get(configName);
    if (!config) return null;
    
    const fullKey = `${config.keyPrefix || 'ratelimit'}:${configName}:${key}`;
    const used = await this.store.get(fullKey) || 0;
    
    return {
      used,
      limit: config.points,
      remaining: Math.max(0, config.points - used),
      resetAt: new Date(Date.now() + config.duration * 1000),
    };
  }
}

// Express middleware factory
export function createRateLimitMiddleware(
  limiter: RateLimiter,
  options?: {
    keyGenerator?: (req: any) => string;
    configSelector?: (req: any) => string;
    onLimitReached?: (req: any, res: any) => void;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  }
) {
  const {
    keyGenerator = (req: any) => req.user?.id || req.ip,
    configSelector = (req: any) => {
      const method = req.method.toLowerCase();
      const path = req.path;
      
      // Determine config based on route
      if (path.includes('/auth/login')) return 'auth:login';
      if (path.includes('/auth/register')) return 'auth:register';
      if (path.includes('/auth/reset')) return 'auth:reset-password';
      if (path.includes('/auth/2fa')) return 'auth:2fa';
      if (path.includes('/upload')) return 'api:upload';
      if (path.includes('/export')) return 'api:export';
      if (path.includes('/admin') && method === 'delete') return 'admin:delete';
      if (path.includes('/admin/bulk')) return 'admin:bulk';
      
      return method === 'get' ? 'api:read' : 'api:write';
    },
    onLimitReached,
  } = options || {};
  
  return async (req: any, res: any, next: any) => {
    try {
      const key = keyGenerator(req);
      const configName = configSelector(req);
      
      const result = await limiter.consume(key, 1, configName);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', result.remaining + 1);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());
      
      // Store result for potential post-request processing
      req.rateLimitResult = result;
      
      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        res.setHeader('Retry-After', error.retryAfter);
        res.setHeader('X-RateLimit-Limit', error.context?.limit || 0);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + error.retryAfter * 1000).toISOString());
        
        if (onLimitReached) {
          onLimitReached(req, res);
        } else {
          res.status(429).json(error.toJSON());
        }
      } else {
        next(error);
      }
    }
  };
}

// Utility to create a distributed rate limiter with sliding window
export class SlidingWindowRateLimiter {
  private store: RateLimitStore;
  private windowMs: number;
  private maxPoints: number;
  
  constructor(
    store: RateLimitStore,
    windowMs: number,
    maxPoints: number
  ) {
    this.store = store;
    this.windowMs = windowMs;
    this.maxPoints = maxPoints;
  }
  
  async consume(key: string, points = 1): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // In a real implementation, this would use Redis sorted sets
    // For now, we'll use a simplified approach
    const currentCount = await this.store.get(key) || 0;
    
    if (currentCount + points > this.maxPoints) {
      const resetAt = new Date(now + this.windowMs);
      throw new RateLimitError(
        Math.ceil(this.windowMs / 1000),
        this.maxPoints
      );
    }
    
    const newCount = await this.store.increment(
      key,
      points,
      Math.ceil(this.windowMs / 1000)
    );
    
    return {
      allowed: true,
      remaining: Math.max(0, this.maxPoints - newCount),
      resetAt: new Date(now + this.windowMs),
    };
  }
}