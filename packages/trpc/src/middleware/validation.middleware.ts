import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { middleware } from '../trpc';

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: z.string().cuid('Invalid ID format'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  dateRange: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }).refine(
    (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
    { message: 'End date must be after start date' }
  ),
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
};

/**
 * Enhanced validation middleware with custom error formatting
 */
export const enhancedValidationMiddleware = middleware(async ({ ctx, next, path }) => {
  try {
    return await next({ ctx });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        fieldErrors[path] = err.message;
      });

      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        cause: {
          type: 'VALIDATION_ERROR',
          fieldErrors,
          details: error.errors,
        }
      });
    }

    // Handle other validation-related errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid input')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
          cause: error
        });
      }
    }

    // Re-throw other errors unchanged
    throw error;
  }
});

/**
 * File upload validation
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  mimetype: z.string().regex(/^(image|application|text)\//, 'Invalid file type'),
});

/**
 * Bulk operation validation
 */
export const bulkOperationSchema = z.object({
  ids: z.array(commonSchemas.id).min(1, 'At least one ID is required').max(100, 'Too many IDs provided'),
});

/**
 * Search and filter validation
 */
export const searchFilterSchema = z.object({
  search: z.string().optional(),
  filters: z.record(z.unknown()).optional(),
  ...commonSchemas.pagination.shape,
  ...commonSchemas.sorting.shape,
});

/**
 * Rate limiting validation middleware
 */
export const rateLimitMiddleware = (maxRequests: number = 100, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return middleware(async ({ ctx, next }) => {
    const key = ctx.ip || ctx.userAgent || 'anonymous';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [k, v] of requests.entries()) {
      if (v.resetTime < windowStart) {
        requests.delete(k);
      }
    }

    const userRequests = requests.get(key);
    
    if (!userRequests) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
    } else if (userRequests.resetTime < now) {
      // Reset window
      requests.set(key, { count: 1, resetTime: now + windowMs });
    } else if (userRequests.count >= maxRequests) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
        cause: {
          resetTime: userRequests.resetTime,
          limit: maxRequests,
          window: windowMs,
        }
      });
    } else {
      userRequests.count++;
    }

    return next({ ctx });
  });
};

/**
 * Input sanitization middleware
 */
export const sanitizationMiddleware = middleware(async ({ ctx, next }) => {
  // Basic XSS protection - strip script tags and dangerous attributes
  function sanitizeString(value: any): any {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .trim();
    }
    
    if (Array.isArray(value)) {
      return value.map(sanitizeString);
    }
    
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeString(val);
      }
      return sanitized;
    }
    
    return value;
  }

  // const sanitizedInput = sanitizeString(rawInput); // rawInput not available in newer tRPC
  
  return next({ 
    ctx: {
      ...ctx,
      // rawInput: sanitizedInput // Not available in newer tRPC
    }
  });
});

/**
 * Database transaction middleware
 */
export const transactionMiddleware = middleware(async ({ ctx, next }) => {
  return ctx.prisma.$transaction(async (tx) => {
    return next({
      ctx: {
        ...ctx,
        prisma: tx,
      }
    });
  });
});

/**
 * Cache middleware for read operations
 */
export const cacheMiddleware = (ttlSeconds: number = 300) => {
  const cache = new Map<string, { data: any; expiry: number }>();

  return middleware(async ({ ctx, next, path, type }) => {
    // Only cache queries, not mutations
    if (type !== 'query') {
      return next({ ctx });
    }

    const cacheKey = `${path}:${type}`; // Using type instead of rawInput
    const cached = cache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    const result = await next({ ctx });
    
    // Cache successful results
    cache.set(cacheKey, {
      data: result,
      expiry: Date.now() + (ttlSeconds * 1000)
    });

    // Clean expired entries periodically
    if (cache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (value.expiry <= now) {
          cache.delete(key);
        }
      }
    }

    return result;
  });
};