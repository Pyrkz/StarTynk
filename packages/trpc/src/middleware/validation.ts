import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { middleware } from '../server';

/**
 * Enhanced validation middleware with sanitization
 */
export const validationMiddleware = middleware(async ({ next, input }) => {
  // Basic input validation
  if (input && typeof input === 'object') {
    // Remove null prototype objects
    if (Object.getPrototypeOf(input) === null) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid input format',
      });
    }
  }
  
  return next();
});

/**
 * Enhanced validation with custom error formatting
 */
export const enhancedValidationMiddleware = middleware(async ({ next, input, path }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod errors in a user-friendly way
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        cause: {
          fieldErrors: formattedErrors,
          zodError: error.flatten(),
        },
      });
    }
    
    throw error;
  }
});

/**
 * Input sanitization middleware
 */
export const sanitizationMiddleware = middleware(async ({ next, input }) => {
  if (input && typeof input === 'object') {
    const sanitized = sanitizeInput(input);
    return next({ input: sanitized });
  }
  
  return next();
});

/**
 * Recursively sanitize input data
 */
function sanitizeInput(input: any): any {
  if (input === null || input === undefined) {
    return input;
  }
  
  if (typeof input === 'string') {
    // Basic XSS protection - strip HTML tags
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: z.string().cuid('Invalid ID format'),
  uuid: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  url: z.string().url('Invalid URL format'),
  dateString: z.string().datetime('Invalid date format'),
  
  // Pagination
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  
  // Search and filtering
  search: z.string().min(1).max(100).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  
  // File upload
  fileUpload: z.object({
    filename: z.string().min(1).max(255),
    mimetype: z.string().min(1),
    size: z.number().min(1).max(10 * 1024 * 1024), // 10MB max
  }),
};

/**
 * File upload validation schema
 */
export const fileUploadSchema = z.object({
  files: z.array(commonSchemas.fileUpload).min(1).max(10),
  category: z.enum(['document', 'image', 'video', 'audio']).optional(),
});

/**
 * Bulk operation schema
 */
export const bulkOperationSchema = z.object({
  ids: z.array(commonSchemas.id).min(1).max(100),
  action: z.enum(['delete', 'update', 'archive']),
  data: z.record(z.any()).optional(),
});

/**
 * Search and filter schema
 */
export const searchFilterSchema = z.object({
  search: commonSchemas.search,
  filters: z.record(z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
  ])).optional(),
  sort: z.object({
    field: z.string(),
    order: commonSchemas.sortOrder,
  }).optional(),
  ...commonSchemas.pagination.shape,
});

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return data.from <= data.to;
    }
    return true;
  },
  {
    message: 'Start date must be before end date',
    path: ['from'],
  }
);

/**
 * Address schema
 */
export const addressSchema = z.object({
  street: z.string().min(1).max(100),
  city: z.string().min(1).max(50),
  state: z.string().min(1).max(50),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(50).default('Poland'),
});

/**
 * Geolocation schema
 */
export const geolocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
});

/**
 * Money amount schema (in cents to avoid floating point issues)
 */
export const moneySchema = z.object({
  amount: z.number().int().min(0), // Amount in cents
  currency: z.string().length(3).default('PLN'), // ISO currency code
});