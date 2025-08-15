import { LRUCache } from 'lru-cache';
import { ApiError } from '../errors';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimiters = new Map<string, LRUCache<string, RateLimitEntry>>();

function getDefaultKey(request: Request): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent}`;
}

export function createRateLimiter(name: string, options: RateLimitOptions) {
  const cache = new LRUCache<string, RateLimitEntry>({
    max: 5000,
    ttl: options.windowMs
  });
  
  rateLimiters.set(name, cache);

  return async function rateLimitMiddleware(request: Request): Promise<void> {
    const key = options.keyGenerator?.(request) || getDefaultKey(request);
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    let entry = cache.get(key);
    
    if (!entry || entry.resetTime <= windowStart) {
      entry = {
        count: 1,
        resetTime: now + options.windowMs
      };
    } else {
      entry.count += 1;
    }
    
    cache.set(key, entry);
    
    if (entry.count > options.max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      throw new ApiError(
        options.message || 'Too many requests',
        'RATE_LIMIT_EXCEEDED',
        429,
        { retryAfter }
      );
    }
  };
}

export const strictRateLimit = createRateLimiter('strict', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many requests from this IP, please try again later.'
});

export const standardRateLimit = createRateLimiter('standard', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Rate limit exceeded. Please try again later.'
});

export const relaxedRateLimit = createRateLimiter('relaxed', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Rate limit exceeded. Please try again later.'
});

export const authRateLimit = createRateLimiter('auth', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: (req: Request) => {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    return `auth:${ip}`;
  },
  message: 'Too many authentication attempts. Please try again later.'
});

export function createUserBasedRateLimit(windowMs: number, max: number) {
  return createRateLimiter(`user-${Date.now()}`, {
    windowMs,
    max,
    keyGenerator: (req: Request) => {
      // Extract user ID from Authorization header or use IP as fallback
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.slice(7);
          // In a real implementation, you'd decode the JWT to get user ID
          // For now, we'll use the token as the key
          return `user:${token.slice(0, 20)}`;
        } catch {
          // Fall back to IP-based rate limiting
        }
      }
      return getDefaultKey(req);
    },
    message: 'Rate limit exceeded for this user. Please try again later.'
  });
}