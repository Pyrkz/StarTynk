import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api-client';

interface UseApiQueryOptions<TData> extends Omit<UseQueryOptions<TData, ApiError>, 'queryKey' | 'queryFn'> {
  url: string;
  params?: Record<string, any>;
}

export function useApiQuery<TData = unknown>(
  key: string | string[],
  options: UseApiQueryOptions<TData>
) {
  const { url, params, ...queryOptions } = options;

  return useQuery<TData, ApiError>({
    queryKey: Array.isArray(key) ? [...key, params] : [key, params],
    queryFn: () => api.get<TData>(url, { params }),
    ...queryOptions,
  });
}

interface UseApiMutationOptions<TData, TVariables> 
  extends Omit<UseMutationOptions<TData, ApiError, TVariables>, 'mutationFn'> {
  url: string;
  method?: 'post' | 'put' | 'patch' | 'delete';
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  options: UseApiMutationOptions<TData, TVariables>
) {
  const { url, method = 'post', ...mutationOptions } = options;

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: (variables) => {
      switch (method) {
        case 'put':
          return api.put<TData>(url, variables);
        case 'patch':
          return api.patch<TData>(url, variables);
        case 'delete':
          return api.delete<TData>(url);
        default:
          return api.post<TData>(url, variables);
      }
    },
    ...mutationOptions,
  });
}