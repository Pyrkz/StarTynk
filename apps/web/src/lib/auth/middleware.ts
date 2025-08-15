import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from './jwt';
import type { User, Role } from '@shared/types';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface AuthResult {
  user?: AuthUser;
  error?: string;
  status?: number;
}

/**
 * Authenticates a JWT token from the Authorization header
 * @param request The incoming request
 * @returns AuthResult with user data or error information
 */
export async function authenticateToken(request: Request): Promise<AuthResult> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      return { 
        error: 'No token provided', 
        status: 401 
      };
    }

    // Verify the token
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Invalid token', 
        status: 401 
      };
    }

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { 
        id: true, 
        email: true, 
        role: true, 
        isActive: true 
      }
    });

    if (!user) {
      return { 
        error: 'User not found', 
        status: 401 
      };
    }

    if (!user.isActive) {
      return { 
        error: 'User account is inactive', 
        status: 401 
      };
    }

    // Ensure role type safety
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      isActive: user.isActive
    };

    return { user: authUser };
  } catch (error) {
    console.error('Authentication error:', error);
    return { 
      error: 'Authentication failed', 
      status: 500 
    };
  }
}

/**
 * Checks if a user has the required role(s)
 * @param userRole The user's current role
 * @param requiredRoles Array of allowed roles
 * @returns True if user has one of the required roles
 */
export function hasRequiredRole(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Extracts Bearer token from Authorization header
 * @param authHeader The Authorization header value
 * @returns The token or null
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}