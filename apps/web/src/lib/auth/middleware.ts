import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { User } from '@repo/database';
import { detectClientType, verifyToken, extractBearerToken } from './unified-auth';
import { ApiResponse } from '@/lib/api/api-response';

/**
 * Rate limiting storage (in production, use Redis or similar)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for an identifier
 */
export async function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<boolean> {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);
  
  if (!limit || limit.resetTime < now) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxAttempts) {
    return false;
  }
  
  limit.count++;
  return true;
}

/**
 * Authenticate a request based on client type
 */
export async function authenticateRequest(request: NextRequest): Promise<User | null> {
  const clientType = detectClientType(request);
  
  if (clientType === 'mobile') {
    // Check JWT token
    const token = extractBearerToken(request);
    if (!token) return null;
    
    try {
      const payload = verifyToken(token) as any;
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });
      
      if (!user || !user.isActive) {
        return null;
      }
      
      return user;
    } catch (error) {
      return null;
    }
  } else {
    // Check session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(process.env.SESSION_COOKIE_NAME || '__session');
    
    if (!sessionCookie) return null;
    
    try {
      const payload = jwt.verify(sessionCookie.value, process.env.NEXTAUTH_SECRET!) as any;
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });
      
      if (!user || !user.isActive) {
        return null;
      }
      
      return user;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Legacy support for authenticateToken (used in existing code)
 */
export async function authenticateToken(request: Request): Promise<{
  user?: any;
  error?: string;
  status?: number;
}> {
  // Convert Request to NextRequest for compatibility
  const nextRequest = new NextRequest(request.url, {
    headers: request.headers,
    method: request.method,
  });
  
  const user = await authenticateRequest(nextRequest);
  
  if (!user) {
    return { 
      error: 'Authentication required', 
      status: 401 
    };
  }
  
  return {
    user: {
      id: user.id,
      email: user.email || '',
      role: user.role,
      isActive: user.isActive,
    }
  };
}

/**
 * HOC for protected routes
 */
export function withAuth<T extends any[], R>(
  handler: (request: NextRequest, user: User, ...args: T) => Promise<R>,
  options?: {
    roles?: string[];
    verified?: boolean;
  }
) {
  return async (request: NextRequest, ...args: T): Promise<R | NextResponse> => {
    // Authenticate request
    const user = await authenticateRequest(request);
    
    if (!user) {
      return ApiResponse.unauthorized('Authentication required');
    }
    
    // Check role if specified
    if (options?.roles && !options.roles.includes(user.role)) {
      return ApiResponse.forbidden('Insufficient permissions');
    }
    
    // Check verification if required
    if (options?.verified) {
      const hasVerifiedEmail = user.email && user.emailVerified;
      const hasVerifiedPhone = user.phone && user.phoneVerified;
      
      if (!hasVerifiedEmail && !hasVerifiedPhone) {
        return ApiResponse.forbidden('Account verification required');
      }
    }
    
    // Call the handler with authenticated user
    return handler(request, user, ...args);
  };
}

/**
 * Middleware for rate limiting auth endpoints
 */
export async function rateLimitAuth(
  request: NextRequest,
  identifier?: string
): Promise<NextResponse | null> {
  // Get identifier from request body or IP
  const id = identifier || 
    request.headers.get('X-Forwarded-For') || 
    request.headers.get('X-Real-IP') || 
    'unknown';
  
  const allowed = await checkRateLimit(id);
  
  if (!allowed) {
    return ApiResponse.tooManyRequests('Too many attempts. Please try again later.');
  }
  
  return null;
}

/**
 * Extract user info from request without full authentication
 */
export async function getUserFromRequest(request: NextRequest): Promise<{
  id: string;
  email?: string;
  phone?: string;
  role: string;
} | null> {
  const clientType = detectClientType(request);
  
  try {
    if (clientType === 'mobile') {
      const token = extractBearerToken(request);
      if (!token) return null;
      
      const payload = verifyToken(token) as any;
      return {
        id: payload.userId,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
      };
    } else {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get(process.env.SESSION_COOKIE_NAME || '__session');
      
      if (!sessionCookie) return null;
      
      const payload = jwt.verify(sessionCookie.value, process.env.NEXTAUTH_SECRET!) as any;
      return {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }
  } catch {
    return null;
  }
}

/**
 * Checks if a user has the required role(s)
 */
export function hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}