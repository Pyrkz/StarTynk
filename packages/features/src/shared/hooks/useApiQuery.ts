import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createWebAPIClient } from '@repo/api';
import { useAuth } from '../../auth/hooks/useAuth.shared';
import type { RequestConfig } from '@repo/api';

/**
 * Unified API query hook that works with auth and caching
 */
export function useApiQuery<T = any>(
  queryKey: any[],
  url: string,
  config?: RequestConfig,
  options?: any
) {
  const { authService, isAuthenticated } = useAuth();
  const apiClient = createWebAPIClient(undefined, authService as any);

  return useQuery({
    queryKey,
    queryFn: () => apiClient.get<T>(url, config),
    enabled: config?.requireAuth ? isAuthenticated : true,
    ...options,
  });
}

/**
 * Unified API mutation hook
 */
export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: any
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Auto-invalidate related queries
      queryClient.invalidateQueries();
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * User-specific hooks
 */
export function useUser() {
  return useApiQuery(['user'], '/users/profile', { requireAuth: true });
}

export function useUserUpdate() {
  const { authService } = useAuth();
  const apiClient = createWebAPIClient(undefined, authService as any);

  return useApiMutation(
    async (userData: any) => apiClient.patch('/users/profile', userData),
    {
      onSuccess: () => {
        // Update auth store with new user data
      },
    }
  );
}