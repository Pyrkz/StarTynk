import { NextRequest } from 'next/server';
import { ClientType, type AuthContext } from '../types';
import { detectClientType, extractBearerToken, extractDeviceId } from './client-detector';
import { tokenService } from '../services/jwt.service';
import { sessionService } from '../services/session.service';
import { getSession } from 'next-auth/react';
import { prisma } from '@repo/database';

/**
 * Authentication result interface
 */
interface AuthResult {
  authenticated: boolean;
  user: AuthContext | null;
  error?: string;
  clientType: ClientType;
}

/**
 * Unified authentication middleware that handles both web and mobile clients
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Detect client type from request
    const clientType: ClientType = detectClientType(request);
    
    // Mobile authentication (JWT)
    if (clientType === 'mobile') {
      const token = extractBearerToken(request.headers.get('authorization'));
      
      if (!token) {
        return {
          authenticated: false,
          user: null,
          error: 'No authorization token provided',
          clientType
        };
      }

      try {
        // Verify JWT token
        const payload = await tokenService.verifyAccessToken(token);
        
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            role: true,
            name: true,
            isActive: true,
            deletedAt: true
          }
        });

        if (!user || !user.isActive || user.deletedAt) {
          return {
            authenticated: false,
            user: null,
            error: 'User account is inactive',
            clientType
          };
        }

        const deviceId = extractDeviceId(request);

        return {
          authenticated: true,
          user: {
            userId: user.id,
            email: user.email,
            role: user.role,
            clientType,
            deviceId
          },
          clientType
        };
      } catch (error) {
        return {
          authenticated: false,
          user: null,
          error: error instanceof Error ? error.message : 'Invalid token',
          clientType
        };
      }
    } 
    
    // Web authentication (Session)
    else {
      // For API routes, check session from headers or cookies
      const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                         request.cookies.get('__Secure-next-auth.session-token')?.value;
      
      if (!sessionToken) {
        return {
          authenticated: false,
          user: null,
          error: 'No session found',
          clientType
        };
      }

      const sessionPayload = sessionService.verifySessionToken(sessionToken);
      
      if (!sessionPayload) {
        return {
          authenticated: false,
          user: null,
          error: 'Invalid session',
          clientType
        };
      }

      // Verify user is still active
      const user = await prisma.user.findUnique({
        where: { id: sessionPayload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          deletedAt: true
        }
      });

      if (!user || !user.isActive || user.deletedAt) {
        return {
          authenticated: false,
          user: null,
          error: 'User account is inactive',
          clientType
        };
      }

      return {
        authenticated: true,
        user: {
          userId: sessionPayload.userId,
          email: sessionPayload.email,
          role: sessionPayload.role,
          clientType,
          sessionId: sessionToken
        },
        clientType
      };
    }
  } catch (error) {
    return {
      authenticated: false,
      user: null,
      error: error instanceof Error ? error.message : 'Authentication middleware failed',
      clientType: ClientType.WEB
    };
  }
}

/**
 * Middleware for API routes that require authentication
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, context: { user: AuthContext; clientType: ClientType }) => Promise<T>
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
      clientType: authResult.clientType
    });
  };
}

/**
 * Middleware for API routes that optionally use authentication
 */
export function withOptionalAuth<T = any>(
  handler: (request: NextRequest, context: { user: AuthContext | null; clientType: ClientType }) => Promise<T>
) {
  return async (request: NextRequest): Promise<T> => {
    const authResult = await authenticateRequest(request);
    
    return handler(request, { 
      user: authResult.authenticated ? authResult.user : null,
      clientType: authResult.clientType
    });
  };
}

/**
 * Role-based authentication middleware
 */
export function withRoleAuth<T = any>(
  allowedRoles: string[],
  handler: (request: NextRequest, context: { user: AuthContext; clientType: ClientType }) => Promise<T>
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
      clientType: authResult.clientType
    });
  };
}

/**
 * Admin-only authentication middleware
 */
export function withAdminAuth<T = any>(
  handler: (request: NextRequest, context: { user: AuthContext; clientType: ClientType }) => Promise<T>
) {
  return withRoleAuth(['ADMIN'], handler);
}

/**
 * Coordinator+ authentication middleware (COORDINATOR, ADMIN)
 */
export function withCoordinatorAuth<T = any>(
  handler: (request: NextRequest, context: { user: AuthContext; clientType: ClientType }) => Promise<T>
) {
  return withRoleAuth(['COORDINATOR', 'ADMIN'], handler);
}