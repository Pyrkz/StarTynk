import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { createAuthService } from '@repo/auth';
import type { 
  LoginRequest, 
  RegisterRequest, 
  UnifiedAuthResponse 
} from '@repo/shared/types';

/**
 * Unified auth hook that works across web and mobile platforms
 * Provides consistent auth interface with platform-specific optimizations
 */
export function useAuth() {
  const authServiceRef = useRef(createAuthService());
  
  const {
    user,
    isAuthenticated,
    isLoading,
    isLoginLoading,
    isLogoutLoading,
    error,
    loginError,
    platform,
    isOnline,
    login: storeLogin,
    logout: storeLogout,
    register: storeRegister,
    refreshToken: storeRefreshToken,
    getCurrentUser,
    setUser,
    setError,
    clearError,
    checkAuthStatus,
    setOnlineStatus,
  } = useAuthStore();

  // Inject auth service into store
  useEffect(() => {
    // @ts-ignore - Temporarily override getAuthService
    useAuthStore.setState({
      getAuthService: () => authServiceRef.current,
    });
  }, []);

  // Network status monitoring for mobile
  useEffect(() => {
    if (platform === 'mobile') {
      // Monitor network status (implementation depends on your network monitoring)
      const handleNetworkChange = (isOnline: boolean) => {
        setOnlineStatus(isOnline);
      };

      // Add network listeners here
      // NetInfo.addEventListener(handleNetworkChange);
      // return () => NetInfo.removeEventListener(handleNetworkChange);
    }
  }, [platform, setOnlineStatus]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!isAuthenticated || platform === 'web') return;

    const interval = setInterval(async () => {
      try {
        await storeRefreshToken();
      } catch (error) {
        console.error('Auto refresh failed:', error);
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, platform, storeRefreshToken]);

  // Enhanced login with better error handling
  const login = useCallback(async (request: LoginRequest): Promise<UnifiedAuthResponse> => {
    try {
      const response = await storeLogin(request);
      return response;
    } catch (error) {
      console.error('Login error in hook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }, [storeLogin]);

  // Enhanced logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      await storeLogout();
    } catch (error) {
      console.error('Logout error in hook:', error);
      // Still clear local state even if logout request fails
    }
  }, [storeLogout]);

  // Enhanced register
  const register = useCallback(async (request: RegisterRequest): Promise<UnifiedAuthResponse> => {
    try {
      const response = await storeRegister(request);
      return response;
    } catch (error) {
      console.error('Register error in hook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }, [storeRegister]);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Public interface
  return {
    // User data
    user,
    isAuthenticated,
    
    // Loading states
    isLoading,
    isLoginLoading,
    isLogoutLoading,
    
    // Error states
    error,
    loginError,
    
    // Actions
    login,
    logout,
    register,
    refreshToken: storeRefreshToken,
    getCurrentUser,
    
    // Utilities
    clearError,
    setError,
    checkAuthStatus,
    
    // Platform info
    platform,
    isOnline,
    
    // Advanced
    authService: authServiceRef.current,
  };
}