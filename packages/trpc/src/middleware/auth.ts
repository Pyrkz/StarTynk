import { TRPCError } from '@trpc/server';
import { middleware } from '../server';
import type { Context, AuthenticatedContext } from '../context';

/**
 * Authentication middleware that requires a valid user
 */
export const authMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      userId: ctx.user.id,
      authType: ctx.authType!,
    } as AuthenticatedContext,
  });
});

/**
 * Role-based authorization middleware factory
 */
export function requireRole(...allowedRoles: string[]) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        userId: ctx.user.id,
      } as AuthenticatedContext,
    });
  });
}

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Manager or Admin middleware
 */
export const requireModeratorOrAdmin = requireRole('MANAGER', 'ADMIN');

/**
 * Coordinator or above middleware
 */
export const requireCoordinatorOrAbove = requireRole('COORDINATOR', 'MANAGER', 'ADMIN');

/**
 * Self or Admin access middleware (for profile operations)
 */
export function requireSelfOrAdmin(getUserId: (input: any) => string) {
  return middleware(async ({ ctx, input, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const targetUserId = getUserId(input);
    const isAdmin = ctx.user.role === 'ADMIN';
    const isSelf = ctx.user.id === targetUserId;

    if (!isAdmin && !isSelf) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only access your own data',
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        userId: ctx.user.id,
      } as AuthenticatedContext,
    });
  });
}

/**
 * Project access middleware (checks if user has access to specific project)
 */
export function requireProjectAccess(getProjectId: (input: any) => string) {
  return middleware(async ({ ctx, input, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const projectId = getProjectId(input);
    
    // Admin can access any project
    if (ctx.user.role === 'ADMIN') {
      return next({
        ctx: {
          ...ctx,
          user: ctx.user,
          userId: ctx.user.id,
        } as AuthenticatedContext,
      });
    }

    // Check if user has access to this project
    const projectAccess = await ctx.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: ctx.user.id,
      },
    });

    if (!projectAccess) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this project',
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        userId: ctx.user.id,
        projectId,
      } as AuthenticatedContext & { projectId: string },
    });
  });
}

/**
 * Rate limiting middleware
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(opts: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (ctx: Context) => string;
}) {
  return middleware(async ({ ctx, next, path }) => {
    const key = opts.keyGenerator 
      ? opts.keyGenerator(ctx)
      : `${ctx.user?.id || ctx.ip}:${path}`;
    
    const now = Date.now();
    const windowStart = now - opts.windowMs;
    
    // Clean up old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
    
    const current = rateLimitStore.get(key);
    
    if (!current || current.resetTime < now) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + opts.windowMs,
      });
    } else {
      // Within existing window
      if (current.count >= opts.maxRequests) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)}s`,
        });
      }
      
      current.count++;
    }
    
    return next();
  });
}

/**
 * Logging middleware for audit trails
 */
export const auditMiddleware = middleware(async ({ ctx, next, path, type, input }) => {
  const start = Date.now();
  
  try {
    const result = await next();
    const duration = Date.now() - start;
    
    // Log successful operations (especially mutations)
    if (type === 'mutation' && ctx.user) {
      console.log(`[AUDIT] ${ctx.user.id} ${type} ${path} - SUCCESS (${duration}ms)`, {
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        path,
        type,
        duration,
        requestId: ctx.requestId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        // Don't log sensitive input data
        hasInput: !!input,
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    // Log failed operations
    console.error(`[AUDIT] ${ctx.user?.id || 'anonymous'} ${type} ${path} - ERROR (${duration}ms)`, {
      userId: ctx.user?.id,
      userEmail: ctx.user?.email,
      path,
      type,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: ctx.requestId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    
    throw error;
  }
});