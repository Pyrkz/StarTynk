import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc';
import { type BaseContext, type AuthenticatedContext, addUserToContext, isAuthenticatedContext } from '../context';
import { type UnifiedUserDTO, Role } from '@repo/shared';
import { TokenService } from '@repo/auth';

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Extract session token from cookie (for web clients)
 */
function extractSessionToken(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  
  const sessionCookie = cookieHeader
    .split(';')
    .find(cookie => cookie.trim().startsWith('session='));
    
  if (!sessionCookie) return null;
  
  return sessionCookie.split('=')[1] || null;
}

/**
 * Enhanced JWT token verification with security checks
 */
async function verifyJWTTokenEnhanced(token: string, ctx: BaseContext): Promise<UnifiedUserDTO | null> {
  try {
    const payload = await tokenService.verifyAccessToken(token);
    
    // Fetch user from database with security checks
    const user = await ctx.prisma.user.findUnique({
      where: { 
        id: payload.userId,
        isActive: true,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        isActive: true,
        lastLoginAt: true,
      }
    });

    if (!user) {
      console.warn(`⚠️  JWT token valid but user ${payload.userId} not found or inactive`);
      return null;
    }

    // Optional: Device consistency check for additional security
    if (payload.deviceId) {
      const userAgent = ctx.req?.headers?.['user-agent'] || 
                       (ctx as any).request?.headers?.['user-agent'];
      const ip = ctx.ip;
      
      const deviceConsistent = await tokenService.validateDeviceConsistency(
        payload.deviceId,
        userAgent,
        ip
      );
      
      if (!deviceConsistent) {
        console.warn(`⚠️  Device inconsistency detected for user ${user.id}, device ${payload.deviceId}`);
        // Continue but log the event - don't block access immediately for UX
      }
    }

    return {
      id: user.id,
      name: user.name || undefined,
      email: user.email,
      phone: user.phone || undefined,
      role: user.role,
      emailVerified: !!user.emailVerified,
      phoneVerified: false, // TODO: Add phone verification when implemented
    };
  } catch (error) {
    console.error('Enhanced JWT verification failed:', error);
    return null;
  }
}

/**
 * Verify session token and return user data
 */
async function verifySessionToken(sessionToken: string, ctx: BaseContext): Promise<{ user: UnifiedUserDTO; sessionId: string } | null> {
  try {
    // Find active session
    const session = await ctx.prisma.session.findUnique({
      where: { 
        sessionToken,
        expires: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            emailVerified: true,
            isActive: true,
            deletedAt: true,
          }
        }
      }
    });

    if (!session || !session.user || !session.user.isActive || session.user.deletedAt) {
      return null;
    }

    const user: UnifiedUserDTO = {
      id: session.user.id,
      name: session.user.name || undefined,
      email: session.user.email,
      phone: session.user.phone || undefined,
      role: session.user.role,
      emailVerified: !!session.user.emailVerified,
      phoneVerified: false,
    };

    return { user, sessionId: session.id };
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

// Initialize enhanced token service
const tokenService = new TokenService();

/**
 * Enhanced authentication middleware - supports both JWT and session authentication
 */
export const authMiddleware = middleware(async ({ ctx, next, path }) => {
  // Skip auth for certain paths (like login, register)
  const publicPaths = [
    'auth.login',
    'auth.register', 
    'auth.refreshToken',
    'auth.mobileLogin',
    'auth.mobileRefresh',
    'auth.sendOtp',
    'auth.verifyOtp',
    'auth.verifyToken'
  ];

  if (publicPaths.includes(path)) {
    return next({ ctx });
  }

  // Extract headers from different possible sources
  const authHeader = ctx.req?.headers?.authorization || 
                    (ctx as any).request?.headers?.authorization ||
                    (ctx as any).headers?.authorization;
  const cookieHeader = ctx.req?.headers?.cookie || 
                      (ctx as any).request?.headers?.cookie ||
                      (ctx as any).headers?.cookie;

  let user: UnifiedUserDTO | null = null;
  let sessionId: string | undefined;

  // Strategy 1: Try JWT token first (for mobile/API clients)
  const bearerToken = extractBearerToken(authHeader);
  if (bearerToken) {
    user = await verifyJWTTokenEnhanced(bearerToken, ctx);
  }

  // Strategy 2: Fallback to session token (for web clients)
  if (!user) {
    const sessionToken = extractSessionToken(cookieHeader);
    if (sessionToken) {
      const sessionResult = await verifySessionToken(sessionToken, ctx);
      if (sessionResult) {
        user = sessionResult.user;
        sessionId = sessionResult.sessionId;
      }
    }
  }

  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      cause: 'No valid authentication token provided'
    });
  }

  const authenticatedCtx = addUserToContext(ctx, user, sessionId);

  return next({ ctx: authenticatedCtx });
});

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: Role[]) => {
  return middleware(async ({ ctx, next }) => {
    if (!isAuthenticatedContext(ctx)) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required for role-based access'
      });
    }

    if (!allowedRoles.includes(ctx.user.role as Role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    return next({ ctx });
  });
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole([Role.ADMIN]);

/**
 * Admin or Moderator middleware
 */
export const requireModeratorOrAdmin = requireRole([Role.ADMIN, Role.MODERATOR]);

/**
 * Coordinator, Moderator or Admin middleware
 */
export const requireCoordinatorOrAbove = requireRole([Role.ADMIN, Role.MODERATOR, Role.COORDINATOR]);

/**
 * Validation middleware for request input
 */
export const validationMiddleware = middleware(async ({ ctx, next, path }) => {
  try {
    return next({ ctx });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid input data',
        cause: error
      });
    }
    throw error;
  }
});

/**
 * Logging middleware for request/response tracking
 */
export const loggingMiddleware = middleware(async ({ ctx, next, path, type }) => {
  const start = Date.now();
  
  console.log(`[tRPC] ${type} ${path} - Request ID: ${ctx.requestId}`);
  
  try {
    const result = await next({ ctx });
    const duration = Date.now() - start;
    
    console.log(`[tRPC] ${type} ${path} - Success (${duration}ms) - Request ID: ${ctx.requestId}`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    console.error(`[tRPC] ${type} ${path} - Error (${duration}ms) - Request ID: ${ctx.requestId}:`, error);
    
    throw error;
  }
});