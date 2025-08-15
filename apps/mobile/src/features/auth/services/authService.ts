import api from '@/src/services/api';
import storageService from '@/src/services/storage';
import { ENDPOINTS } from '@/src/config/api';
import { LoginFormData, LoginResponse, AuthUser } from '../types';

interface LoginRequest {
  identifier: string; // email or phone
  password: string;
  loginMethod: 'phone' | 'email';
}

class AuthService {
  async login(formData: LoginFormData): Promise<LoginResponse> {
    const loginData: LoginRequest = {
      identifier: formData.loginMethod === 'phone' ? formData.phoneNumber : formData.email,
      password: formData.password,
      loginMethod: formData.loginMethod,
    };

    const response = await api.post<LoginResponse>(ENDPOINTS.auth.login, loginData);
    
    // Store tokens
    await storageService.setAuthToken(response.data.accessToken);
    if (response.data.refreshToken) {
      await storageService.setItem('refresh_token', response.data.refreshToken);
    }
    
    // Store user data
    await storageService.setUserData(response.data.user);
    
    // Remember me functionality
    if (formData.rememberMe) {
      await storageService.setItem('remember_me', 'true');
      await storageService.setItem('saved_identifier', loginData.identifier);
      await storageService.setItem('login_method', formData.loginMethod);
    } else {
      await storageService.removeItem('remember_me');
      await storageService.removeItem('saved_identifier');
      await storageService.removeItem('login_method');
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post(ENDPOINTS.auth.logout);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      await storageService.clearAll();
    }
  }

  async getCurrentUser(): Promise<AuthUser> {
    const response = await api.get<AuthUser>(ENDPOINTS.auth.me);
    return response.data;
  }

  async refreshToken(): Promise<string> {
    const refreshToken = await storageService.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<{ accessToken: string; refreshToken: string }>(
      '/api/auth/refresh',
      { refreshToken }
    );

    await storageService.setAuthToken(response.data.accessToken);
    await storageService.setItem('refresh_token', response.data.refreshToken);

    return response.data.accessToken;
  }

  async checkAuthStatus(): Promise<boolean> {
    const token = await storageService.getAuthToken();
    if (!token) return false;

    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getRememberedCredentials(): Promise<{
    identifier: string;
    loginMethod: 'phone' | 'email';
  } | null> {
    const rememberMe = await storageService.getItem('remember_me');
    if (rememberMe !== 'true') return null;

    const identifier = await storageService.getItem('saved_identifier');
    const loginMethod = await storageService.getItem('login_method') as 'phone' | 'email';

    if (!identifier || !loginMethod) return null;

    return { identifier, loginMethod };
  }
}

export default new AuthService();