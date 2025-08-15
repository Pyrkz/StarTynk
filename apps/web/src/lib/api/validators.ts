import { z } from 'zod';

/**
 * Common validation schemas for API routes
 */

// Pagination query parameters
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Sorting query parameters
export const sortingSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Combined query parameters for list endpoints
export const listQuerySchema = paginationSchema.merge(sortingSchema).extend({
  search: z.string().optional(),
});

// Common ID parameter
export const idParamSchema = z.object({
  id: z.string().min(1),
});

// Date range filter
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
});

// Phone number validation (Polish format)
export const phoneSchema = z.string()
  .regex(/^\+?[0-9]{9,15}$/, 'Invalid phone number format')
  .optional();

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Email validation
export const emailSchema = z.string()
  .email('Invalid email format')
  .toLowerCase();

/**
 * Parses and validates query parameters
 * @param searchParams URLSearchParams or query object
 * @param schema Zod schema to validate against
 * @returns Validated data
 */
export function parseQueryParams<T>(
  searchParams: URLSearchParams | Record<string, any>,
  schema: z.ZodSchema<T>
): T {
  const params = searchParams instanceof URLSearchParams
    ? Object.fromEntries(searchParams.entries())
    : searchParams;
  
  return schema.parse(params);
}

/**
 * Validates request body
 * @param body Request body
 * @param schema Zod schema to validate against
 * @returns Validated data
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

/**
 * Creates a sanitized user object without sensitive data
 * @param user User object from database
 * @returns User without password and other sensitive fields
 */
export function sanitizeUser(user: any) {
  const { 
    password, 
    resetPasswordToken, 
    resetPasswordExpires,
    emailVerificationToken,
    ...sanitized 
  } = user;
  
  return sanitized;
}