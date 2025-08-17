import { useState, useCallback } from 'react';
import { LoginCredentials, RegisterCredentials, User } from '../../../types/user.types';
import { authService } from '../services/authService';
import { storageService } from '../../../shared/utils/storageService';
import { useAppStore } from '../../../store/useAppStore';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, setIsAuthenticated } = useAppStore();

  const login = useCallback(async (credentials: LoginCredentials, rememberMe: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting login with:', credentials.identifier);
      const response = await authService.login(credentials);
      console.log('Login response:', response);
      
      const { user, accessToken } = response;
      
      if (rememberMe) {
        await storageService.setItem('auth_token', accessToken);
        await storageService.setItem('user_data', JSON.stringify(user));
      }
      
      console.log('Setting user:', user);
      setUser(user);
      console.log('Setting isAuthenticated to true');
      setIsAuthenticated(true);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd logowania';
      console.error('Login error in hook:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsAuthenticated]);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(credentials);
      const { user, accessToken } = response;
      
      await storageService.setItem('auth_token', accessToken);
      await storageService.setItem('user_data', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd rejestracji';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsAuthenticated]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await authService.logout();
      await storageService.removeItem('auth_token');
      await storageService.removeItem('user_data');
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsAuthenticated]);

  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.forgotPassword(email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd resetowania hasła';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    login,
    register,
    logout,
    forgotPassword,
    isLoading,
    error,
  };
};