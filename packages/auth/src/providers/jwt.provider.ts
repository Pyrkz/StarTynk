import { NextRequest } from 'next/server';
import type { AuthResult, AuthProvider } from '../types';
import { 
  extractBearerTokenFromRequest,
  getUserFromAccessToken,
  logUserActivity,
  createSecurityContext
} from '../services';

/**
 * JWT Authentication Provider for mobile clients
 */
export class JWTAuthProvider implements AuthProvider {
  /**
   * Authenticate request using JWT Bearer token
   */
  async authenticate(request: NextRequest): Promise<AuthResult> {
    try {
      // Extract Bearer token from Authorization header
      const token = extractBearerTokenFromRequest(request);
      
      if (!token) {
        return {
          authenticated: false,
          user: null,
          error: 'No Bearer token provided'
        };
      }
      
      // Verify token and get user
      const user = await getUserFromAccessToken(token);
      
      if (!user) {
        return {
          authenticated: false,
          user: null,
          error: 'Invalid or expired token'
        };
      }
      
      // Log successful authentication
      const securityContext = createSecurityContext({
        'user-agent': request.headers.get('user-agent') || undefined,
        'x-forwarded-for': request.headers.get('x-forwarded-for') || undefined,
        'x-real-ip': request.headers.get('x-real-ip') || undefined,
      });
      
      await logUserActivity(
        user.id,
        'jwt_auth_success',
        { endpoint: request.url },
        securityContext
      );
      
      return {
        authenticated: true,
        user,
        clientType: 'mobile'
      };
    } catch (error) {
      return {
        authenticated: false,
        user: null,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }
  
  /**
   * JWT provider doesn't create sessions (stateless)
   */
  async createSession(): Promise<void> {
    // No-op for JWT provider
  }
  
  /**
   * Clear session for JWT provider means invalidating tokens
   */
  async clearSession(request: NextRequest): Promise<void> {
    // Token invalidation is handled by the refresh service
    // This is a no-op as tokens are stateless
  }
}