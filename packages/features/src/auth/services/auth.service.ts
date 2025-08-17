import type { 
  UnifiedLoginRequest,
  UnifiedUserDTO,
  ApiResponse,
  UnifiedAuthResponse
} from '@repo/shared/types';
import { tokenService } from './token.service';

class AuthService {
  private baseURL: string;
  
  constructor() {
    // Use environment variable or default
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 
                   process.env.EXPO_PUBLIC_API_URL || 
                   '/api/v1';
    
    console.log('🔵 AuthService - baseURL:', this.baseURL);
  }

  async login(credentials: UnifiedLoginRequest): Promise<UnifiedAuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/unified-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': this.getClientType(),
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });

    const data: ApiResponse<UnifiedAuthResponse> = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }

    // Store tokens if mobile
    if (data.data.accessToken) {
      await tokenService.setTokens(data.data.accessToken, data.data.refreshToken);
    }

    return data.data;
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseURL}/auth/unified-logout`, {
        method: 'POST',
        headers: {
          'X-Client-Type': this.getClientType(),
          ...(await this.getAuthHeaders()),
        },
        credentials: 'include',
      });
    } finally {
      await tokenService.clearTokens();
    }
  }

  async getCurrentUser(): Promise<UnifiedUserDTO | null> {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: {
          ...(await this.getAuthHeaders()),
        },
        credentials: 'include',
      });

      if (!response.ok) return null;
      
      const data: ApiResponse<{ user: UnifiedUserDTO }> = await response.json();
      return data.success ? data.data.user : null;
    } catch {
      return null;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await tokenService.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': this.getClientType(),
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) return false;

      const data: ApiResponse<{ accessToken: string; refreshToken?: string }> = await response.json();
      
      if (data.success && data.data.accessToken) {
        await tokenService.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  private getClientType(): string {
    return typeof window !== 'undefined' && !('expo' in window)
      ? 'web'
      : 'mobile';
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await tokenService.getAccessToken();
    return token 
      ? { 'Authorization': `Bearer ${token}` }
      : {};
  }
}

export const authService = new AuthService();