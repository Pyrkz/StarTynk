import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { authStore } from '../stores/auth.store.mobile';
import type { 
  UnifiedUserDTO, 
  UnifiedLoginRequest,
  LoginMethod,
  ClientType
} from '@repo/shared/types';

// Helper type for optional rememberMe inputs
interface LoginRequestOptional {
  identifier: string;
  password: string;
  loginMethod?: LoginMethod;
  clientType?: ClientType;
  deviceId?: string;
  rememberMe?: boolean;
}

export interface UseAuthOptions {
  onLoginSuccess?: (user: UnifiedUserDTO) => void;
  onLoginError?: (error: Error) => void;
  onLogoutSuccess?: () => void;
}

export function useAuth(options?: UseAuthOptions) {
  const queryClient = useQueryClient();
  const { user, setUser, clearUser } = authStore();
  
  console.log('🔵 useAuth.shared - authStore state:', { user, isAuthenticated: !!user });

  // Get current user
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authService.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequestOptional) => {
      // Convert optional rememberMe to required with default value
      const loginRequest: UnifiedLoginRequest = {
        ...credentials,
        rememberMe: credentials.rememberMe ?? false,
      };
      return authService.login(loginRequest);
    },
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
        queryClient.setQueryData(['auth', 'user'], data.user);
        options?.onLoginSuccess?.(data.user);
      }
    },
    onError: (error: Error) => {
      options?.onLoginError?.(error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearUser();
      queryClient.clear();
      options?.onLogoutSuccess?.();
    },
  });

  // Refresh token mutation
  const refreshMutation = useMutation({
    mutationFn: authService.refreshToken,
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      }
    },
  });

  // Check auth status function
  const checkAuthStatus = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        return true;
      } else {
        clearUser();
        return false;
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      clearUser();
      return false;
    }
  }, [setUser, clearUser]);

  const finalUser = user || currentUser;
  const finalIsAuthenticated = !!user || !!currentUser;
  
  console.log('🔵 useAuth.shared - Final state:', { 
    finalUser, 
    finalIsAuthenticated, 
    isLoading,
    userFromStore: user,
    userFromQuery: currentUser
  });
  
  return {
    // State
    user: finalUser,
    isAuthenticated: finalIsAuthenticated,
    isLoading,
    
    // Actions
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['auth', 'user'] }),
    refreshToken: refreshMutation.mutate,
    checkAuthStatus,
    
    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    
    // Service access
    authService,
  };
}