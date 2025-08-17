import { NextRequest } from 'next/server';
import type { AuthResult, AuthProvider, LoginDto, RefreshTokenResponse } from '../types';
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
          success: false,
          user: undefined,
          error: { code: 'NO_TOKEN', message: 'No Bearer token provided' }
        };
      }
      
      // Verify token and get user
      const user = await getUserFromAccessToken(token);
      
      if (!user) {
        return {
          success: false,
          user: undefined,
          error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
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
        success: true,
        user,
        message: 'Authentication successful'
      };
    } catch (error) {
      return {
        success: false,
        user: undefined,
        error: { code: 'AUTH_ERROR', message: error instanceof Error ? error.message : 'Authentication failed' }
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

  /**
   * Login method for JWT provider
   */
  async login(credentials: LoginDto): Promise<AuthResult> {
    // This method would typically be implemented in a separate auth service
    // For now, return error as this provider is for authentication, not login
    return {
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Login not implemented in JWT provider' }
    };
  }

  /**
   * Logout method for JWT provider
   */
  async logout(): Promise<void> {
    // Token invalidation is handled by the refresh service
    // This is a no-op as tokens are stateless
  }

  /**
   * Refresh token method
   */
  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    // This would typically call the token refresh service
    return {
      success: false,
      error: 'Refresh not implemented in JWT provider'
    };
  }

  /**
   * Validate token method
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const user = await getUserFromAccessToken(token);
      return !!user;
    } catch {
      return false;
    }
  }
}