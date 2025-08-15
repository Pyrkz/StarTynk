import api from './api';
import { ENDPOINTS } from '../config/api';
import storageService from './storage';
import { 
  User, 
  LoginDTO, 
  RegisterDTO,
  LoginResponseDTO 
} from '@repo/shared/types';

// Re-export DTOs for backward compatibility
export type LoginData = Pick<LoginDTO, 'email' | 'password'>;
export type RegisterData = Pick<RegisterDTO, 'email' | 'password' | 'name'>;

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