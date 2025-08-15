import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { authStore } from '../stores/auth.store';
import { LoginRequestDTO, UserDTO } from '@repo/shared/types';

export interface UseAuthOptions {
  onLoginSuccess?: (user: UserDTO) => void;
  onLoginError?: (error: Error) => void;
  onLogoutSuccess?: () => void;
}

export function useAuth(options?: UseAuthOptions) {
  const queryClient = useQueryClient();
  const { user, setUser, clearUser } = authStore();

  // Get current user
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authService.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    onSuccess: (data) => {
      if (data) setUser(data);
      else clearUser();
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequestDTO) => authService.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['auth', 'user'], data.user);
      options?.onLoginSuccess?.(data.user);
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
        queryClient.invalidateQueries(['auth', 'user']);
      }
    },
  });

  return {
    // State
    user: user || currentUser,
    isAuthenticated: !!user || !!currentUser,
    isLoading,
    
    // Actions
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    refresh: () => queryClient.invalidateQueries(['auth', 'user']),
    refreshToken: refreshMutation.mutate,
    
    // Mutation states
    isLoggingIn: loginMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading,
    loginError: loginMutation.error,
  };
}