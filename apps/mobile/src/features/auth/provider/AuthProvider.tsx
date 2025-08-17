import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider wrapper for mobile app
 * The actual auth state is managed by Zustand in @repo/features
 * This just ensures auth is initialized on app start
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    console.log('🔵 AuthProvider - Checking auth status on mount');
    // Check auth status on mount
    const initializeAuth = async () => {
      try {
        await checkAuthStatus();
        console.log('🔵 AuthProvider - Auth status check completed');
      } catch (error) {
        console.error('🔴 AuthProvider - Auth status check failed:', error);
      }
    };
    
    initializeAuth();
  }, [checkAuthStatus]);

  return <>{children}</>;
}