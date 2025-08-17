import { TRPCError } from '@trpc/server';
import { middleware } from '../server';

/**
 * Cache middleware for read operations
 */
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function cacheMiddleware(ttlSeconds: number = 300) {
  return middleware(async ({ next, path, type, input, ctx }) => {
    // Only cache queries, not mutations or subscriptions
    if (type !== 'query') {
      return next();
    }
    
    const cacheKey = `${path}:${JSON.stringify(input)}:${ctx.user?.id || 'anonymous'}`;
    const now = Date.now();
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < (cached.ttl * 1000)) {
      console.log(`[CACHE] HIT ${path}`);
      return cached.data;
    }
    
    // Execute and cache result
    const result = await next();
    cache.set(cacheKey, {
      data: result,
      timestamp: now,
      ttl: ttlSeconds,
    });
    
    // Clean up old cache entries periodically
    if (cache.size > 1000) {
      for (const [key, value] of cache.entries()) {
        if ((now - value.timestamp) > (value.ttl * 1000)) {
          cache.delete(key);
        }
      }
    }
    
    console.log(`[CACHE] MISS ${path}`);
    return result;
  });
}

/**
 * Transaction middleware for database operations
 */
export const transactionMiddleware = middleware(async ({ next, ctx }) => {
  // For mutations, wrap in a transaction
  return ctx.prisma.$transaction(async (tx) => {
    return next({
      ctx: {
        ...ctx,
        prisma: tx,
      },
    });
  });
});

/**
 * Performance monitoring middleware
 */
export const performanceMiddleware = middleware(async ({ next, path, type, ctx }) => {
  const start = Date.now();
  const startMemory = process.memoryUsage();
  
  try {
    const result = await next();
    const duration = Date.now() - start;
    const endMemory = process.memoryUsage();
    const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`[PERF] SLOW ${type} ${path} - ${duration}ms`, {
        duration,
        memoryDiff: Math.round(memoryDiff / 1024 / 1024 * 100) / 100, // MB
        requestId: ctx.requestId,
      });
    }
    
    // Track metrics (in production, send to monitoring service)
    if (process.env.NODE_ENV === 'production') {
      // Example: datadog.histogram('trpc.duration', duration, [`path:${path}`, `type:${type}`]);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    console.error(`[PERF] ERROR ${type} ${path} - ${duration}ms`, {
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: ctx.requestId,
    });
    
    throw error;
  }
});

/**
 * Request timeout middleware
 */
export function timeoutMiddleware(timeoutMs: number = 30000) {
  return middleware(async ({ next, path, type }) => {
    const result = await Promise.race([
      next(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new TRPCError({
            code: 'TIMEOUT',
            message: `Operation timed out after ${timeoutMs}ms`,
          }));
        }, timeoutMs);
      }),
    ]);
    return result;
  });
}

/**
 * Request size limit middleware
 */
export function requestSizeLimitMiddleware(maxSizeBytes: number = 1024 * 1024) {
  return middleware(async ({ next, input }) => {
    const inputSize = JSON.stringify(input).length;
    
    if (inputSize > maxSizeBytes) {
      throw new TRPCError({
        code: 'PAYLOAD_TOO_LARGE',
        message: `Request payload too large: ${inputSize} bytes (max: ${maxSizeBytes})`,
      });
    }
    
    return next();
  });
}

/**
 * Concurrent request limit middleware
 */
const activeRequests = new Map<string, number>();

export function concurrencyLimitMiddleware(maxConcurrent: number = 10) {
  return middleware(async ({ next, ctx, path }) => {
    const key = ctx.user?.id || ctx.ip || 'anonymous';
    const current = activeRequests.get(key) || 0;
    
    if (current >= maxConcurrent) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Too many concurrent requests (${current}/${maxConcurrent})`,
      });
    }
    
    activeRequests.set(key, current + 1);
    
    try {
      const result = await next();
      return result;
    } finally {
      const newCount = (activeRequests.get(key) || 1) - 1;
      if (newCount <= 0) {
        activeRequests.delete(key);
      } else {
        activeRequests.set(key, newCount);
      }
    }
  });
}

/**
 * Health check middleware
 */
export const healthCheckMiddleware = middleware(async ({ next, path }) => {
  // Check if this is a health check endpoint  
  if (path.includes('health')) {
    // For health check endpoints, we bypass normal processing
    throw new TRPCError({
      code: 'METHOD_NOT_SUPPORTED',
      message: 'Health check should be handled by dedicated endpoint'
    });
  }
  
  return next();
});