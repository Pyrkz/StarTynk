import { useState, useEffect } from 'react';
import type { AuthState, AuthUser } from '../types';

// TODO: Replace with actual auth context/store implementation
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Check for stored auth token
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // TODO: Check AsyncStorage for token and validate
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Failed to check auth status',
      }));
    }
  };

  const login = async (accessToken: string, user: AuthUser) => {
    // TODO: Store token in AsyncStorage
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  };

  const logout = async () => {
    // TODO: Clear AsyncStorage
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  return {
    ...authState,
    login,
    logout,
  };
}