import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc';
import { type BaseContext, type AuthenticatedContext, addUserToContext, isAuthenticatedContext } from '../context';
import { type UnifiedUserDTO, Role } from '@repo/shared';
import { TokenService } from '@repo/auth';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '../../../apps/web/src/lib/auth';

// Temporary placeholder for next-auth session
const getServerSession = async (): Promise<any> => null;
const authOptions = {}; // Temporary placeholder

/**
 * Enhanced dual-mode authentication middleware
 * Supports both JWT tokens (mobile) and session cookies (web) simultaneously
 */

const tokenService = new TokenService();

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
  
  // Look for NextAuth session token
  const sessionCookie = cookieHeader
    .split(';')
    .find(cookie => cookie.trim().startsWith('next-auth.session-token=') || 
                    cookie.trim().startsWith('__Secure-next-auth.session-token='));
    
  if (!sessionCookie) return null;
  
  return sessionCookie.split('=')[1] || null;
}

/**
 * Verify JWT token and return user data with enhanced security
 */
async function verifyJWTToken(token: string, ctx: BaseContext): Promise<UnifiedUserDTO | null> {
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
        // Continue but log the event - don't block access immediately
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
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Verify NextAuth session and return user data
 */
async function verifyNextAuthSession(req: any): Promise<{ user: UnifiedUserDTO; sessionId: string } | null> {
  try {
    // Use NextAuth to verify session
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return null;
    }

    // Convert NextAuth session to our unified format
    const user: UnifiedUserDTO = {
      id: session.user.id,
      name: session.user.name || undefined,
      email: session.user.email || '',
      phone: undefined, // NextAuth sessions don't typically include phone
      role: session.user.role || 'USER',
      emailVerified: !!session.user.emailVerified,
      phoneVerified: false,
    };

    return { user, sessionId: session.user.id }; // Using user ID as session ID for now
  } catch (error) {
    console.error('NextAuth session verification failed:', error);
    return null;
  }
}

/**
 * Determine client type from request headers
 */
function detectClientType(headers: Record<string, string | undefined>): 'mobile' | 'web' {
  const clientTypeHeader = headers['x-client-type'];
  const userAgent = headers['user-agent'] || '';
  
  // Explicit client type header
  if (clientTypeHeader === 'mobile') return 'mobile';
  if (clientTypeHeader === 'web') return 'web';
  
  // Detect from User-Agent
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    return 'mobile';
  }
  
  // Default to web for browser-based requests
  return 'web';
}

/**
 * Enhanced dual-mode authentication middleware
 * Intelligently routes between JWT and session-based authentication
 */
export const dualAuthMiddleware = middleware(async ({ ctx, next, path }) => {
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

  // Extract headers from different possible sources (support various tRPC contexts)
  const headers = ctx.req?.headers || (ctx as any).request?.headers || (ctx as any).headers || {};
  
  const authHeader = headers.authorization;
  const cookieHeader = headers.cookie;
  const clientType = detectClientType(headers);

  let user: UnifiedUserDTO | null = null;
  let sessionId: string | undefined;
  let authMethod: 'jwt' | 'session' | null = null;

  // Strategy 1: Try JWT token first (prioritize for mobile clients)
  const bearerToken = extractBearerToken(authHeader);
  if (bearerToken) {
    user = await verifyJWTToken(bearerToken, ctx);
    if (user) {
      authMethod = 'jwt';
    }
  }

  // Strategy 2: Fallback to NextAuth session (for web clients)
  if (!user && cookieHeader) {
    const sessionResult = await verifyNextAuthSession(ctx.req || { headers });
    if (sessionResult) {
      user = sessionResult.user;
      sessionId = sessionResult.sessionId;
      authMethod = 'session';
    }
  }

  // Strategy 3: Final fallback - try session token directly for legacy support
  if (!user && cookieHeader) {
    const sessionToken = extractSessionToken(cookieHeader);
    if (sessionToken) {
      try {
        const session = await ctx.prisma.session.findUnique({
          where: { 
            sessionToken,
            expires: { gt: new Date() }
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

        if (session?.user && session.user.isActive && !session.user.deletedAt) {
          user = {
            id: session.user.id,
            name: session.user.name || undefined,
            email: session.user.email,
            phone: session.user.phone || undefined,
            role: session.user.role,
            emailVerified: !!session.user.emailVerified,
            phoneVerified: false,
          };
          sessionId = session.id;
          authMethod = 'session';
        }
      } catch (error) {
        console.error('Legacy session verification failed:', error);
      }
    }
  }

  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      cause: `No valid authentication found. Client: ${clientType}, Method attempted: ${authMethod || 'none'}`
    });
  }

  // Log authentication method for monitoring
  console.log(`🔐 Auth successful: ${authMethod} (${clientType}) for user ${user.id}`);

  const authenticatedCtx = addUserToContext(ctx, user, sessionId);

  return next({ ctx: authenticatedCtx });
});

/**
 * Enhanced role-based authorization middleware with audit logging
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
      // Log authorization failure for security monitoring
      console.warn(`🚫 Authorization failed: User ${ctx.user.id} (${ctx.user.role}) attempted access requiring: ${allowedRoles.join(', ')}`);
      
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    return next({ ctx });
  });
};

/**
 * Optional authentication middleware (doesn't throw if not authenticated)
 */
export const optionalAuthMiddleware = middleware(async ({ ctx, next }) => {
  const headers = ctx.req?.headers || (ctx as any).request?.headers || (ctx as any).headers || {};
  
  const authHeader = headers.authorization;
  const cookieHeader = headers.cookie;

  let user: UnifiedUserDTO | null = null;
  let sessionId: string | undefined;

  // Try JWT first
  const bearerToken = extractBearerToken(authHeader);
  if (bearerToken) {
    user = await verifyJWTToken(bearerToken, ctx);
  }

  // Fallback to session
  if (!user && cookieHeader) {
    const sessionResult = await verifyNextAuthSession(ctx.req || { headers });
    if (sessionResult) {
      user = sessionResult.user;
      sessionId = sessionResult.sessionId;
    }
  }

  const authenticatedCtx = user 
    ? addUserToContext(ctx, user, sessionId)
    : ctx;

  return next({ ctx: authenticatedCtx });
});

/**
 * Rate limiting middleware for sensitive operations
 */
export const rateLimitMiddleware = (identifier: 'ip' | 'user' = 'ip', maxRequests = 100, windowMs = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return middleware(async ({ ctx, next }) => {
    const now = Date.now();
    const key = identifier === 'ip' 
      ? ctx.ip || 'unknown'
      : isAuthenticatedContext(ctx) ? ctx.user.id : ctx.ip || 'unknown';

    const current = requests.get(key);
    if (current && current.resetTime > now) {
      if (current.count >= maxRequests) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded. Please try again later.',
        });
      }
      current.count++;
    } else {
      requests.set(key, { count: 1, resetTime: now + windowMs });
    }

    return next({ ctx });
  });
};

/**
 * Security headers middleware
 */
export const securityHeadersMiddleware = middleware(async ({ ctx, next }) => {
  const result = await next({ ctx });

  // Add security headers to response if available
  if (ctx.res || (ctx as any).response) {
    const res = ctx.res || (ctx as any).response;
    if (res.setHeader) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  }

  return result;
});

// Convenience exports
export const requireAdmin = requireRole([Role.ADMIN]);
export const requireModeratorOrAdmin = requireRole([Role.ADMIN, Role.MODERATOR]);
export const requireCoordinatorOrAbove = requireRole([Role.ADMIN, Role.MODERATOR, Role.COORDINATOR]);