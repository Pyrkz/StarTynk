import api from './api';
import { ENDPOINTS } from '../config/api';
import storageService from './storage';
import { User } from '../types/models';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

class AuthService {
  async login(data: LoginData): Promise<{ user: User; token: string }> {
    const response = await api.post<{ user: User; token: string }>(
      ENDPOINTS.auth.login,
      data
    );
    
    // Store token and user data
    await storageService.setAuthToken(response.data.token);
    await storageService.setUserData(response.data.user);
    
    return response.data;
  }

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await api.post<{ user: User; token: string }>(
      ENDPOINTS.auth.register,
      data
    );
    
    // Store token and user data
    await storageService.setAuthToken(response.data.token);
    await storageService.setUserData(response.data.user);
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post(ENDPOINTS.auth.logout);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      await storageService.clearAll();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>(ENDPOINTS.auth.me);
    return response.data;
  }
}

export default new AuthService();