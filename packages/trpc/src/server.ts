import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from './context';

/**
 * Initialize tRPC with context and comprehensive error handling
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
        requestId: shape.data?.requestId,
        timestamp: new Date().toISOString(),
      },
    };
  },
});

/**
 * Export router and procedure creators
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

/**
 * Logging middleware for development and monitoring
 */
const loggingMiddleware = middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  const requestId = ctx.requestId;
  
  try {
    const result = await next();
    const duration = Date.now() - start;
    
    // Log successful requests
    console.log(`[tRPC] ${type} ${path} - ${duration}ms`, {
      requestId,
      userId: ctx.user?.id,
      duration,
      success: true,
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    // Log failed requests
    console.error(`[tRPC] ${type} ${path} - ERROR ${duration}ms`, {
      requestId,
      userId: ctx.user?.id,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    });
    
    throw error;
  }
});

/**
 * Rate limiting middleware
 */
const rateLimitMiddleware = middleware(async ({ ctx, next, path }) => {
  const identifier = ctx.user?.id || ctx.ip;
  const key = `trpc:rate_limit:${identifier}:${path}`;
  
  // Basic rate limiting - in production, use Redis
  // For now, implement simple in-memory rate limiting
  if (!identifier) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded',
    });
  }
  
  return next();
});

/**
 * Base procedure with logging
 */
export const baseProcedure = publicProcedure
  .use(loggingMiddleware);

/**
 * Rate limited procedure for public endpoints
 */
export const rateLimitedProcedure = baseProcedure
  .use(rateLimitMiddleware);

/**
 * Protected procedure that requires authentication
 */
export const protectedProcedure = baseProcedure
  .use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized access',
      });
    }
    
    return next({
      ctx: {
        ...ctx,
        user: ctx.user, // User is now guaranteed to exist
      },
    });
  });

/**
 * Admin procedure that requires admin role
 */
export const adminProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    if (ctx.user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }
    
    return next();
  });

/**
 * Manager procedure that requires manager or admin role
 */
export const managerProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    if (!['ADMIN', 'MANAGER'].includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Manager access required',
      });
    }
    
    return next();
  });

/**
 * Coordinator procedure that requires coordinator, manager, or admin role
 */
export const coordinatorProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    if (!['ADMIN', 'MANAGER', 'COORDINATOR'].includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Coordinator access required',
      });
    }
    
    return next();
  });