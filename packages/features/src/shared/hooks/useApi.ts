import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { ApiResponse } from '@repo/shared/types';

interface UseApiOptions<TData = unknown> extends Omit<UseQueryOptions<TData, AxiosError>, 'queryKey' | 'queryFn'> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, any>;
  data?: any;
  config?: AxiosRequestConfig;
}

export function useApi<TData = unknown>(
  key: string | string[],
  options: UseApiOptions<TData>
) {
  const { url, method = 'GET', params, data, config, ...queryOptions } = options;

  return useQuery<TData, AxiosError>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const response = await axios<ApiResponse<TData>>({
        url,
        method,
        params,
        data,
        ...config,
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.error?.message || 'Request failed');
    },
    ...queryOptions,
  });
}

interface UseApiMutationOptions<TData = unknown, TVariables = unknown>
  extends Omit<UseMutationOptions<TData, AxiosError, TVariables>, 'mutationFn'> {
  url: string | ((variables: TVariables) => string);
  method?: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  config?: AxiosRequestConfig;
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  options: UseApiMutationOptions<TData, TVariables>
) {
  const { url, method = 'POST', config, ...mutationOptions } = options;

  return useMutation<TData, AxiosError, TVariables>({
    mutationFn: async (variables) => {
      const endpoint = typeof url === 'function' ? url(variables) : url;
      const response = await axios<ApiResponse<TData>>({
        url: endpoint,
        method,
        data: variables,
        ...config,
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.error?.message || 'Request failed');
    },
    ...mutationOptions,
  });
}