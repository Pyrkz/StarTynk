import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { ValidationError, BaseError, ErrorCode } from '../errors';
import { sanitizeObject } from '../sanitizers';

// TRPC validation middleware factory
export function createValidationMiddleware<T extends z.ZodSchema>(
  schema: T,
  options?: {
    sanitize?: boolean;
    transform?: boolean;
  }
) {
  return async (opts: any) => {
    try {
      // Sanitize input if requested
      let input = opts.input;
      if (options?.sanitize !== false) {
        input = sanitizeObject(input, {
          deep: true,
          html: true,
        });
      }
      
      // Validate input
      const result = schema.safeParse(input);
      
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Validation failed',
          cause: ValidationError.fromZodError(result.error),
        });
      }
      
      // Pass transformed or original data
      return opts.next({
        input: options?.transform !== false ? result.data : input,
      });
    } catch (error) {
      // Re-throw TRPC errors
      if (error instanceof TRPCError) {
        throw error;
      }
      
      // Convert our custom errors to TRPC errors
      if (error instanceof BaseError) {
        throw convertToTRPCError(error);
      }
      
      // Default error
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      });
    }
  };
}

// Convert custom errors to TRPC errors
export function convertToTRPCError(error: BaseError): TRPCError {
  let code: TRPCError['code'] = 'INTERNAL_SERVER_ERROR';
  
  // Map status codes to TRPC error codes
  switch (error.statusCode) {
    case 400:
      code = 'BAD_REQUEST';
      break;
    case 401:
      code = 'UNAUTHORIZED';
      break;
    case 403:
      code = 'FORBIDDEN';
      break;
    case 404:
      code = 'NOT_FOUND';
      break;
    case 409:
      code = 'CONFLICT';
      break;
    case 429:
      code = 'TOO_MANY_REQUESTS';
      break;
    case 500:
      code = 'INTERNAL_SERVER_ERROR';
      break;
  }
  
  return new TRPCError({
    code,
    message: error.message,
    cause: error,
  });
}

// Helper for creating validated procedures
export function createValidatedProcedure(t: any) {
  return {
    input: <T extends z.ZodSchema>(
      schema: T,
      options?: {
        sanitize?: boolean;
        transform?: boolean;
      }
    ) => {
      return t.procedure.use(createValidationMiddleware(schema, options));
    },
    
    mutation: <T extends z.ZodSchema>(
      schema: T,
      options?: {
        sanitize?: boolean;
        transform?: boolean;
      }
    ) => {
      return t.procedure
        .use(createValidationMiddleware(schema, options))
        .mutation;
    },
    
    query: <T extends z.ZodSchema>(
      schema: T,
      options?: {
        sanitize?: boolean;
        transform?: boolean;
      }
    ) => {
      return t.procedure
        .use(createValidationMiddleware(schema, options))
        .query;
    },
  };
}

// TRPC error formatter with validation details
export function formatTRPCError(opts: {
  shape: any;
  error: TRPCError;
}): any {
  const { shape, error } = opts;
  
  // Extract validation errors
  if (error.cause instanceof ValidationError) {
    return {
      ...shape,
      data: {
        ...shape.data,
        code: ErrorCode.VALIDATION_ERROR,
        fields: error.cause.fields,
      },
    };
  }
  
  // Extract other custom errors
  if (error.cause instanceof BaseError) {
    return {
      ...shape,
      data: {
        ...shape.data,
        code: error.cause.code,
        context: error.cause.context,
      },
    };
  }
  
  return shape;
}

// Batch validation for TRPC
export function createBatchValidationMiddleware<T extends z.ZodSchema>(
  schema: T,
  options?: {
    maxItems?: number;
    validateEach?: boolean;
  }
) {
  const { maxItems = 100, validateEach = true } = options || {};
  
  return async (opts: any) => {
    const input = opts.input;
    
    // Validate array structure
    if (!Array.isArray(input)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Input must be an array',
      });
    }
    
    if (input.length > maxItems) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Too many items. Maximum allowed: ${maxItems}`,
      });
    }
    
    // Validate each item
    if (validateEach) {
      const validatedItems = [];
      const errors = [];
      
      for (let i = 0; i < input.length; i++) {
        const result = schema.safeParse(input[i]);
        
        if (result.success) {
          validatedItems.push(result.data);
        } else {
          errors.push({
            index: i,
            errors: result.error.issues,
          });
        }
      }
      
      if (errors.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Batch validation failed',
          cause: { errors },
        });
      }
      
      return opts.next({
        input: validatedItems,
      });
    }
    
    return opts.next();
  };
}

// Input sanitization middleware for TRPC
export function createSanitizationMiddleware(options?: {
  html?: boolean;
  sql?: boolean;
  maxDepth?: number;
}) {
  return async (opts: any) => {
    const sanitized = sanitizeObject(opts.input, {
      deep: true,
      html: options?.html !== false,
      sql: options?.sql === true,
      maxDepth: options?.maxDepth,
    });
    
    return opts.next({
      input: sanitized,
    });
  };
}

// Rate limiting middleware for TRPC
export function createTRPCRateLimitMiddleware(
  rateLimiter: any,
  configName: string
) {
  return async (opts: any) => {
    const key = opts.ctx.user?.id || opts.ctx.ip || 'anonymous';
    
    try {
      await rateLimiter.consume(key, 1, configName);
      return opts.next();
    } catch (error) {
      if (error.retryAfter) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: error.message,
          cause: error,
        });
      }
      throw error;
    }
  };
}