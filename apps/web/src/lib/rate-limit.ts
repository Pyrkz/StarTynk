import { NextRequest } from 'next/server';

// Simple in-memory rate limiter for development
// In production, use Redis or another distributed cache
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (now > data.resetTime) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  async limit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: Date;
  }> {
    const now = Date.now();
    const resetTime = now + windowMs;
    const existing = this.requests.get(identifier);

    if (!existing || now > existing.resetTime) {
      // First request or window expired
      this.requests.set(identifier, { count: 1, resetTime });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: new Date(resetTime),
      };
    }

    if (existing.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        limit,
        remaining: 0,
        reset: new Date(existing.resetTime),
      };
    }

    // Increment count
    existing.count++;
    this.requests.set(identifier, existing);

    return {
      success: true,
      limit,
      remaining: limit - existing.count,
      reset: new Date(existing.resetTime),
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

const rateLimiter = new InMemoryRateLimiter();

// Rate limit configurations
export const rateLimitConfigs = {
  // General API rate limit
  api: {
    limit: 100,
    window: 60 * 1000, // 1 minute
  },

  // Auth endpoints (stricter)
  auth: {
    limit: 5,
    window: 15 * 60 * 1000, // 15 minutes
  },

  // Login endpoint (very strict)
  login: {
    limit: 3,
    window: 15 * 60 * 1000, // 15 minutes
  },

  // Data mutations
  mutations: {
    limit: 30,
    window: 60 * 1000, // 1 minute
  },

  // File uploads
  uploads: {
    limit: 10,
    window: 10 * 60 * 1000, // 10 minutes
  },
};

// Get identifier from request
export function getIdentifier(request: NextRequest): string {
  // Priority: User ID > IP > X-Forwarded-For
  const userId = request.headers.get('x-user-id');
  if (userId) return `user:${userId}`;

  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  return `ip:${ip}`;
}

// Rate limit middleware
export async function rateLimit(
  request: NextRequest,
  configName: keyof typeof rateLimitConfigs = 'api'
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
  const identifier = getIdentifier(request);
  const config = rateLimitConfigs[configName];
  
  return rateLimiter.limit(identifier, config.limit, config.window);
}

// Create rate limit response
export function createRateLimitResponse(result: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}) {
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toISOString(),
          'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null; // No rate limit response needed
}

// Add rate limit headers to successful responses
export function addRateLimitHeaders(response: Response, result: {
  limit: number;
  remaining: number;
  reset: Date;
}) {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toISOString());
  return response;
}

// Express-style middleware wrapper
export function withRateLimit(configName: keyof typeof rateLimitConfigs = 'api') {
  return async (request: NextRequest) => {
    const result = await rateLimit(request, configName);
    const rateLimitResponse = createRateLimitResponse(result);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return result; // Return result to be used in route handler
  };
}