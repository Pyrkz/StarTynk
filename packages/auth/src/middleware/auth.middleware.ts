import { NextRequest } from 'next/server';
import type { AuthResult, ClientType } from '../types';
import { detectClientType } from './client-detector';
import { JWTAuthProvider } from '../providers/jwt.provider';
import { SessionAuthProvider } from '../providers/session.provider';

/**
 * Unified authentication middleware that handles both web and mobile clients
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Detect client type from request
    const clientType: ClientType = detectClientType(request);
    
    // Choose appropriate authentication provider
    if (clientType === 'mobile') {
      const jwtProvider = new JWTAuthProvider();
      return await jwtProvider.authenticate(request);
    } else {
      const sessionProvider = new SessionAuthProvider();
      return await sessionProvider.authenticate(request);
    }
  } catch (error) {
    return {
      authenticated: false,
      user: null,
      error: error instanceof Error ? error.message : 'Authentication middleware failed'
    };
  }
}

/**
 * Middleware for API routes that require authentication
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, context: { user: any; clientType: ClientType }) => Promise<T>
) {
  return async (request: NextRequest): Promise<T | Response> => {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.authenticated || !authResult.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authResult.error || 'Authentication required' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return handler(request, { 
      user: authResult.user, 
      clientType: authResult.clientType || 'web' 
    });
  };
}

/**
 * Middleware for API routes that optionally use authentication
 */
export function withOptionalAuth<T = any>(
  handler: (request: NextRequest, context: { user: any | null; clientType: ClientType }) => Promise<T>
) {
  return async (request: NextRequest): Promise<T> => {
    const authResult = await authenticateRequest(request);
    
    return handler(request, { 
      user: authResult.authenticated ? authResult.user : null,
      clientType: authResult.clientType || detectClientType(request)
    });
  };
}

/**
 * Role-based authentication middleware
 */
export function withRoleAuth<T = any>(
  allowedRoles: string[],
  handler: (request: NextRequest, context: { user: any; clientType: ClientType }) => Promise<T>
) {
  return async (request: NextRequest): Promise<T | Response> => {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.authenticated || !authResult.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication required' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!allowedRoles.includes(authResult.user.role)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Insufficient permissions' 
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return handler(request, { 
      user: authResult.user, 
      clientType: authResult.clientType || 'web' 
    });
  };
}

/**
 * Admin-only authentication middleware
 */
export function withAdminAuth<T = any>(
  handler: (request: NextRequest, context: { user: any; clientType: ClientType }) => Promise<T>
) {
  return withRoleAuth(['ADMIN'], handler);
}

/**
 * Coordinator+ authentication middleware (COORDINATOR, ADMIN)
 */
export function withCoordinatorAuth<T = any>(
  handler: (request: NextRequest, context: { user: any; clientType: ClientType }) => Promise<T>
) {
  return withRoleAuth(['COORDINATOR', 'ADMIN'], handler);
}