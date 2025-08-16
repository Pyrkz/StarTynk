import { useState, useCallback, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

interface LoginCredentials {
  identifier: string; // email or phone
  password: string;
  rememberMe?: boolean;
}

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Get unique device ID
 */
async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await SecureStore.getItemAsync('device_id');
    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await SecureStore.setItemAsync('device_id', deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Failed to get device ID:', error);
    return Crypto.randomUUID();
  }
}

/**
 * Get device information
 */
function getDeviceInfo() {
  return {
    platform: Platform.OS as 'ios' | 'android',
    version: Platform.Version.toString(),
    model: Device.modelName || 'Unknown',
    appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  };
}

/**
 * Store authentication tokens securely
 */
async function storeTokens(accessToken: string, refreshToken: string) {
  try {
    await Promise.all([
      SecureStore.setItemAsync('access_token', accessToken),
      SecureStore.setItemAsync('refresh_token', refreshToken),
    ]);
  } catch (error) {
    console.error('Failed to store tokens:', error);
    throw new Error('Failed to store authentication tokens');
  }
}

/**
 * Remove authentication tokens
 */
async function clearTokens() {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync('access_token'),
      SecureStore.deleteItemAsync('refresh_token'),
    ]);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
}

/**
 * Get stored refresh token
 */
async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('refresh_token');
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
}

/**
 * Enhanced authentication hook using tRPC
 */
export function useTRPCAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const utils = trpc.useUtils();

  // Get current user query
  const userQuery = trpc.auth.me.useQuery(undefined, {
    enabled: false, // Manual control
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Enhanced mobile login mutation
  const loginMutation = trpc.auth.mobileLogin.useMutation({
    onSuccess: async (data) => {
      try {
        // Store tokens securely
        await storeTokens(data.accessToken!, data.refreshToken!);
        
        // Update auth state
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Invalidate and refetch user data
        utils.auth.me.invalidate();
      } catch (error) {
        console.error('Login success handling failed:', error);
        setAuthState(prev => ({
          ...prev,
          error: 'Failed to complete login',
          isLoading: false,
        }));
      }
    },
    onError: (error) => {
      setAuthState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
    },
  });

  // Enhanced token refresh mutation
  const refreshMutation = trpc.auth.mobileRefresh.useMutation({
    onSuccess: async (data) => {
      try {
        // Store new tokens
        await storeTokens(data.accessToken, data.refreshToken);
        
        // Refetch user data
        userQuery.refetch();
      } catch (error) {
        console.error('Token refresh handling failed:', error);
        await logout();
      }
    },
    onError: async (error) => {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout the user
      await logout();
    },
  });

  // Logout mutation
  const logoutMutation = trpc.auth.logout.useMutation({
    onSettled: async () => {
      // Clear tokens and state regardless of server response
      await clearTokens();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      
      // Clear all cached data
      utils.invalidate();
    },
  });

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const deviceId = await getDeviceId();
      const deviceInfo = getDeviceInfo();
      
      await loginMutation.mutateAsync({
        identifier: credentials.identifier,
        password: credentials.password,
        deviceId,
        deviceInfo,
        rememberMe: credentials.rememberMe,
      });
    } catch (error) {
      // Error is handled in onError callback
      console.error('Login failed:', error);
    }
  }, [loginMutation]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Try to logout on server (best effort)
      try {
        await logoutMutation.mutateAsync();
      } catch (error) {
        console.warn('Server logout failed, proceeding with local logout:', error);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logoutMutation]);

  // Refresh tokens function
  const refreshTokens = useCallback(async () => {
    try {
      const refreshToken = await getRefreshToken();
      const deviceId = await getDeviceId();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      await refreshMutation.mutateAsync({
        refreshToken,
        deviceId,
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }, [refreshMutation]);

  // Check authentication status on app start
  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const accessToken = await SecureStore.getItemAsync('access_token');
      
      if (!accessToken) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Try to get user data
      const userData = await userQuery.refetch();
      
      if (userData.data) {
        setAuthState({
          user: userData.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        // Token might be expired, try to refresh
        await refreshTokens();
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      await clearTokens();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [userQuery, refreshTokens]);

  // Auto-refresh tokens when they're about to expire
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    // Set up token refresh interval (refresh every 14 minutes for 15-minute tokens)
    const interval = setInterval(() => {
      refreshTokens().catch(error => {
        console.error('Automatic token refresh failed:', error);
      });
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, refreshTokens]);

  // Initialize auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return {
    // State
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading || loginMutation.isPending || logoutMutation.isPending,
    error: authState.error,
    
    // Actions
    login,
    logout,
    refreshTokens,
    checkAuthStatus,
    
    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRefreshing: refreshMutation.isPending,
  };
}