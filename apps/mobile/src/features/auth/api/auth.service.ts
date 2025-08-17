import { tokenStorage } from '../lib/storage/token-storage';
import { api } from '../lib/api-client';
import { 
  LoginRequestDTO, 
  LoginResponseDTO, 
  RegisterRequestDTO,
  UserDTO 
} from '@repo/shared/types';

class AuthService {
  async login(credentials: LoginRequestDTO): Promise<LoginResponseDTO> {
    const response = await api.post<LoginResponseDTO>('/v1/auth/unified-login', {
      ...credentials,
      clientType: 'mobile',
    });

    // Save tokens and user data
    if (response.accessToken) {
      await tokenStorage.saveTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: Date.now() + (response.expiresIn || 900) * 1000,
      });
    }

    if (response.user) {
      await tokenStorage.saveUserData(response.user);
    }

    return response;
  }

  async register(data: RegisterRequestDTO): Promise<UserDTO> {
    const response = await api.post<UserDTO>('/v1/auth/register', data);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/v1/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local tokens
      await tokenStorage.clearAll();
    }
  }

  async getCurrentUser(): Promise<UserDTO | null> {
    try {
      const response = await api.get<UserDTO>('/v1/user/profile');
      await tokenStorage.saveUserData(response);
      return response;
    } catch (error) {
      return null;
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return false;

      const response = await api.post<LoginResponseDTO>('/v1/auth/refresh', {
        refreshToken,
      });

      if (response.accessToken) {
        await tokenStorage.saveTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: Date.now() + (response.expiresIn || 900) * 1000,
        });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await tokenStorage.getAccessToken();
    if (!token) return false;
    
    const isExpired = await tokenStorage.isTokenExpired();
    if (isExpired) {
      // Try to refresh
      return await this.refreshSession();
    }
    
    return true;
  }
}

export const authService = new AuthService();