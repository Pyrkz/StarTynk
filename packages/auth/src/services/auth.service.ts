import type { 
  LoginRequest, 
  UnifiedAuthResponse, 
  UnifiedUser, 
  RegisterRequest,
  RefreshTokenRequest 
} from '@repo/shared/types';
import { authStorage } from '@repo/shared/storage';
import type { UnifiedStorage } from '@repo/shared/storage';

/**
 * Platform detection utility
 */
function detectPlatform(): 'web' | 'mobile' {
  if (typeof window !== 'undefined' && !('expo' in (globalThis as any))) {
    return 'web';
  }
  return 'mobile';
}

/**
 * Unified Authentication Service
 * Handles both web (session-based) and mobile (JWT-based) authentication
 * Platform-agnostic interface with platform-specific implementations
 */
export class UnifiedAuthService {
  private storage: UnifiedStorage;
  private platform: 'web' | 'mobile';
  private apiBaseUrl: string;

  constructor(storage?: UnifiedStorage, apiBaseUrl?: string) {
    this.storage = storage || authStorage;
    this.platform = detectPlatform();
    this.apiBaseUrl = apiBaseUrl || this.getDefaultApiUrl();
  }

  private getDefaultApiUrl(): string {
    if (this.platform === 'web') {
      return process.env.NEXT_PUBLIC_API_URL || '/api';
    } else {
      return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
    }
  }

  /**
   * Unified login method
   * Handles both web sessions and mobile JWT tokens
   */
  async login(data: LoginRequest): Promise<UnifiedAuthResponse> {
    try {
      const endpoint = this.platform === 'mobile' 
        ? '/mobile/v1/auth/login' 
        : '/v1/auth/unified-login';

      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': this.platform,
        },
        body: JSON.stringify({
          ...data,
          clientType: this.platform,
        }),
      });

      const result: UnifiedAuthResponse = await response.json();

      if (result.success && result.user) {
        // Store user data
        await this.storage.setObject('user', result.user);

        // Platform-specific token handling
        if (this.platform === 'mobile' && result.accessToken && result.refreshToken) {
          await this.storage.setSecureItem('accessToken', result.accessToken);
          await this.storage.setSecureItem('refreshToken', result.refreshToken);
        }

        // Handle remember me
        if (data.rememberMe) {
          await this.storage.setBoolean('rememberMe', true);
          await this.storage.setItem('savedIdentifier', data.identifier);
          await this.storage.setItem('loginMethod', data.loginMethod);
        }
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Unified logout method
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      const endpoint = this.platform === 'mobile' 
        ? '/mobile/v1/auth/logout' 
        : '/v1/auth/logout';

      await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': this.platform,
          'Authorization': `Bearer ${await this.storage.getSecureItem('accessToken')}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      await this.storage.clear();
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<UnifiedUser | null> {
    try {
      return await this.storage.getObject<UnifiedUser>('user');
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Refresh authentication token (mobile only)
   */
  async refreshToken(): Promise<UnifiedAuthResponse> {
    if (this.platform === 'web') {
      // Web uses session refresh through NextAuth
      return { success: true, message: 'Session refresh handled by NextAuth' };
    }

    try {
      const refreshToken = await this.storage.getSecureItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.apiBaseUrl}/mobile/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'mobile',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const result: UnifiedAuthResponse = await response.json();

      if (result.success && result.accessToken && result.refreshToken) {
        await this.storage.setSecureItem('accessToken', result.accessToken);
        await this.storage.setSecureItem('refreshToken', result.refreshToken);
      }

      return result;
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<UnifiedAuthResponse> {
    try {
      const endpoint = this.platform === 'mobile' 
        ? '/mobile/v1/auth/register' 
        : '/v1/auth/register';

      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': this.platform,
        },
        body: JSON.stringify({
          ...data,
          clientType: this.platform,
        }),
      });

      const result: UnifiedAuthResponse = await response.json();

      if (result.success && result.user) {
        await this.storage.setObject('user', result.user);

        if (this.platform === 'mobile' && result.accessToken && result.refreshToken) {
          await this.storage.setSecureItem('accessToken', result.accessToken);
          await this.storage.setSecureItem('refreshToken', result.refreshToken);
        }
      }

      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    if (this.platform === 'mobile') {
      const accessToken = await this.storage.getSecureItem('accessToken');
      return !!accessToken;
    }

    // For web, user presence indicates valid session
    return true;
  }

  /**
   * Get remembered credentials (mobile only)
   */
  async getRememberedCredentials(): Promise<{
    identifier: string;
    loginMethod: 'email' | 'phone';
  } | null> {
    try {
      const rememberMe = await this.storage.getBoolean('rememberMe');
      if (!rememberMe) return null;

      const identifier = await this.storage.getItem('savedIdentifier');
      const loginMethod = await this.storage.getItem('loginMethod') as 'email' | 'phone';

      if (!identifier || !loginMethod) return null;

      return { identifier, loginMethod };
    } catch (error) {
      console.error('Get remembered credentials error:', error);
      return null;
    }
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken(): Promise<string | null> {
    return await this.storage.getSecureItem('accessToken');
  }
}