import { z } from 'zod';
import { ValidationError, ErrorHandler } from '../errors';
import { sanitize, sanitizeObject } from '../sanitizers';
import { RateLimiter } from '../rate-limit';

export interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
  sanitize?: boolean | {
    body?: boolean;
    query?: boolean;
    params?: boolean;
    html?: boolean;
    sql?: boolean;
  };
  rateLimit?: string | false;
  transform?: boolean;
}

export interface RequestValidationResult {
  body?: any;
  query?: any;
  params?: any;
  headers?: any;
}

// Main validation middleware factory
export function validate(options: ValidationOptions) {
  return async (req: any, res: any, next: any) => {
    try {
      // Sanitize inputs first if enabled
      if (options.sanitize !== false) {
        const sanitizeOptions = typeof options.sanitize === 'object' 
          ? options.sanitize 
          : { body: true, query: true, params: true, html: true };
        
        if (sanitizeOptions.body && req.body && typeof req.body === 'object') {
          req.body = sanitizeObject(req.body, {
            deep: true,
            html: sanitizeOptions.html !== false,
            sql: sanitizeOptions.sql === true,
          });
        }
        
        if (sanitizeOptions.query && req.query) {
          req.query = sanitizeObject(req.query, {
            deep: true,
            html: sanitizeOptions.html !== false,
            sql: sanitizeOptions.sql === true,
          });
        }
        
        if (sanitizeOptions.params && req.params) {
          req.params = sanitizeObject(req.params, {
            deep: false, // Params are usually simple values
            html: false,
            sql: sanitizeOptions.sql === true,
          });
        }
      }
      
      // Store original values for potential rollback
      const originalBody = req.body;
      const originalQuery = req.query;
      const originalParams = req.params;
      
      // Validate each part
      const validationResult: RequestValidationResult = {};
      
      if (options.body) {
        const result = options.body.safeParse(req.body);
        if (!result.success) {
          throw ValidationError.fromZodError(result.error);
        }
        validationResult.body = result.data;
        if (options.transform !== false) {
          req.body = result.data; // Use transformed data
        }
      }
      
      if (options.query) {
        const result = options.query.safeParse(req.query);
        if (!result.success) {
          throw ValidationError.fromZodError(result.error);
        }
        validationResult.query = result.data;
        if (options.transform !== false) {
          req.query = result.data;
        }
      }
      
      if (options.params) {
        const result = options.params.safeParse(req.params);
        if (!result.success) {
          throw ValidationError.fromZodError(result.error);
        }
        validationResult.params = result.data;
        if (options.transform !== false) {
          req.params = result.data;
        }
      }
      
      if (options.headers) {
        const result = options.headers.safeParse(req.headers);
        if (!result.success) {
          throw ValidationError.fromZodError(result.error);
        }
        validationResult.headers = result.data;
      }
      
      // Store validation result for access in route handlers
      req.validated = validationResult;
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Async validation wrapper for more complex validations
export function validateAsync(
  schema: z.ZodSchema,
  options?: {
    sanitize?: boolean;
    transform?: boolean;
  }
) {
  return async (data: any): Promise<any> => {
    // Sanitize if requested
    if (options?.sanitize) {
      data = sanitizeObject(data, {
        deep: true,
        html: true,
      });
    }
    
    // Validate
    const result = await schema.safeParseAsync(data);
    
    if (!result.success) {
      throw ValidationError.fromZodError(result.error);
    }
    
    return options?.transform !== false ? result.data : data;
  };
}

// Combine multiple middleware
export function validateWithRateLimit(
  validationOptions: ValidationOptions,
  rateLimiter: RateLimiter,
  rateLimitConfig?: string
) {
  return async (req: any, res: any, next: any) => {
    try {
      // Apply rate limiting first if configured
      if (validationOptions.rateLimit !== false) {
        const configName = rateLimitConfig || validationOptions.rateLimit || 'api:read';
        const key = req.user?.id || req.ip;
        
        await rateLimiter.consume(key, 1, configName);
      }
      
      // Then apply validation
      await validate(validationOptions)(req, res, () => {});
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Field-level validation helper
export function validateField<T extends z.ZodSchema>(
  schema: T,
  value: any,
  options?: {
    sanitize?: boolean;
    fieldName?: string;
  }
): z.infer<T> {
  const { sanitize: shouldSanitize = true, fieldName = 'field' } = options || {};
  
  // Sanitize if requested
  if (shouldSanitize && typeof value === 'string') {
    value = sanitize.string(value);
  }
  
  const result = schema.safeParse(value);
  
  if (!result.success) {
    throw ValidationError.singleField(fieldName, result.error.issues[0].message);
  }
  
  return result.data;
}

// Batch validation helper
export function validateBatch<T extends z.ZodSchema>(
  schema: T,
  items: any[],
  options?: {
    maxErrors?: number;
    continueOnError?: boolean;
  }
): {
  valid: z.infer<T>[];
  errors: Array<{ index: number; error: ValidationError }>;
} {
  const { maxErrors = 10, continueOnError = false } = options || {};
  const valid: z.infer<T>[] = [];
  const errors: Array<{ index: number; error: ValidationError }> = [];
  
  for (let i = 0; i < items.length; i++) {
    const result = schema.safeParse(items[i]);
    
    if (result.success) {
      valid.push(result.data);
    } else {
      const error = ValidationError.fromZodError(result.error);
      errors.push({ index: i, error });
      
      if (!continueOnError || errors.length >= maxErrors) {
        break;
      }
    }
  }
  
  return { valid, errors };
}

// Express error handler middleware
export function validationErrorHandler(
  err: any,
  req: any,
  res: any,
  next: any
) {
  const handled = ErrorHandler.handle(err);
  
  // Log error if not operational
  if (!ErrorHandler.isOperationalError(err)) {
    ErrorHandler.logError(err, {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userId: req.user?.id,
    });
  }
  
  // Set headers if provided
  if (handled.headers) {
    Object.entries(handled.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }
  
  res.status(handled.statusCode).json(handled.body);
}

// Validation result checker for conditional logic
export function hasValidationErrors(req: any): boolean {
  return !req.validated || Object.keys(req.validated).length === 0;
}

// Get validated data helper
export function getValidatedData<T = any>(req: any, part: 'body' | 'query' | 'params' = 'body'): T {
  if (!req.validated || !req.validated[part]) {
    throw new Error(`No validated ${part} data found. Ensure validation middleware is applied.`);
  }
  return req.validated[part] as T;
}