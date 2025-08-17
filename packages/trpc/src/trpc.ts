import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from './context';

/**
 * Initialize tRPC with context and transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
        requestId: 
          error.cause && 
          typeof error.cause === 'object' && 
          'requestId' in error.cause 
            ? (error.cause as any).requestId 
            : undefined,
      },
    };
  },
});

/**
 * Export router, procedure, and middleware creators
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

/**
 * Create a logger middleware for development
 */
const logger = middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const ms = Date.now() - start;
  
  console.log(`[tRPC] ${type} ${path} took ${ms}ms`);
  
  return result;
});

/**
 * Base procedure with logging (in development)
 */
export const baseProcedure = publicProcedure.use(logger);

/**
 * Protected procedure that requires authentication
 * This will be extended by the auth middleware
 */
export const protectedProcedure = baseProcedure;