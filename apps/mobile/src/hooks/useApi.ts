import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { createMobileAPIClient } from '@repo/api/mobile';
import { ApiError } from '@repo/api';

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
    queryFn: async () => {
      const api = await createMobileAPIClient();
      return api.get<TData>(url, params ? { headers: { 'X-Query-Params': JSON.stringify(params) } } : {});
    },
    ...queryOptions,
  });
}

interface UseApiMutationOptions<TData, TVariables> 
  extends Omit<UseMutationOptions<TData, ApiError, TVariables>, 'mutationFn'> {
  url: string;
  method?: 'post' | 'put' | 'delete';
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  options: UseApiMutationOptions<TData, TVariables>
) {
  const { url, method = 'post', ...mutationOptions } = options;

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables) => {
      const api = await createMobileAPIClient();
      switch (method) {
        case 'put':
          return api.put<TData>(url, variables);
        case 'delete':
          return api.delete(url) as Promise<TData>;
        default:
          return api.post<TData>(url, variables);
      }
    },
    ...mutationOptions,
  });
}