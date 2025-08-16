import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@repo/auth';
import storageService from '@/src/services/storage';
import { AuthState, AuthUser, LoginFormData, RegisterFormData } from '../types';

interface AuthContextType extends AuthState {
  login: (formData: LoginFormData) => Promise<void>;
  logout: () => Promise<void>;
  register: (formData: RegisterFormData) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const isAuthenticated = await authService.checkAuthStatus();
      
      if (isAuthenticated) {
        const userData = await storageService.getUserData();
        if (userData) {
          setState({
            user: userData as AuthUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          // Token exists but no user data, try to fetch it
          const user = await authService.getCurrentUser();
          await storageService.setUserData(user);
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        }
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Authentication check failed',
      });
    }
  };

  const login = async (formData: LoginFormData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.login(formData);
      
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Login failed',
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await authService.logout();
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      // Even if logout fails on server, clear local state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  const register = async (formData: RegisterFormData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // TODO: Implement register in authService
      throw new Error('Register not implemented');
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Registration failed',
      }));
      throw error;
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}