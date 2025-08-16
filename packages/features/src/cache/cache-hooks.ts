import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { cacheManager } from './cache-strategy';

export interface CachedQueryOptions<TData = unknown, TError = unknown> 
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  entityType: string;
  invalidateOnSuccess?: boolean;
  preload?: boolean;
}

export interface CachedMutationOptions<TData = unknown, TError = unknown, TVariables = unknown>
  extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {
  entityType: string;
  invalidateQueries?: string[];
  optimisticUpdate?: (variables: TVariables) => TData;
}

// Generic cached query hook
export function useCachedQuery<TData = unknown, TError = unknown>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options: CachedQueryOptions<TData, TError>
) {
  const { entityType, preload, ...queryOptions } = options;
  
  // Preload related entities if requested
  if (preload) {
    cacheManager.preload([entityType]).catch(console.error);
  }
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const cacheKey = queryKey.join(':');
      const strategy = cacheManager.getStrategy(entityType);
      
      // Try cache first based on strategy
      if (strategy.strategy === 'CACHE_FIRST' || strategy.strategy === 'CACHE_ONLY') {
        const cached = await cacheManager.get(cacheKey, entityType);
        if (cached) {
          // For CACHE_FIRST, still fetch in background
          if (strategy.strategy === 'CACHE_FIRST') {
            setTimeout(async () => {
              try {
                const fresh = await queryFn();
                await cacheManager.set(cacheKey, fresh, entityType);
              } catch (error) {
                console.error('Background refresh failed:', error);
              }
            }, 0);
          }
          return cached;
        }
        
        if (strategy.strategy === 'CACHE_ONLY') {
          throw new Error('No cached data available');
        }
      }
      
      // Fetch from network
      const data = await queryFn();
      
      // Store in cache
      await cacheManager.set(cacheKey, data, entityType);
      
      return data;
    },
    ...queryOptions,
    meta: {
      ...queryOptions.meta,
      entityType,
    },
  });
}

// Generic cached mutation hook
export function useCachedMutation<TData = unknown, TError = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: CachedMutationOptions<TData, TError, TVariables>
) {
  const queryClient = useQueryClient();
  const { entityType, invalidateQueries, optimisticUpdate, ...mutationOptions } = options;
  
  return useMutation({
    mutationFn,
    ...mutationOptions,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      if (invalidateQueries) {
        await Promise.all(
          invalidateQueries.map(query => 
            queryClient.cancelQueries({ queryKey: [query] })
          )
        );
      }
      
      // Optimistic update
      if (optimisticUpdate) {
        const optimisticData = optimisticUpdate(variables);
        
        // Update cache optimistically
        if (invalidateQueries) {
          invalidateQueries.forEach(query => {
            queryClient.setQueryData([query], optimisticData);
          });
        }
        
        return { optimisticData, invalidateQueries };
      }
      
      // Call original onMutate if provided
      if (mutationOptions.onMutate) {
        return await mutationOptions.onMutate(variables);
      }
    },
    onSuccess: async (data, variables, context) => {
      // Invalidate entity cache
      cacheManager.invalidateEntity(entityType);
      
      // Invalidate specified queries
      if (invalidateQueries) {
        await Promise.all(
          invalidateQueries.map(query => 
            queryClient.invalidateQueries({ queryKey: [query] })
          )
        );
      }
      
      // Call original onSuccess if provided
      if (mutationOptions.onSuccess) {
        await mutationOptions.onSuccess(data, variables, context);
      }
    },
    onError: async (error, variables, context) => {
      // Revert optimistic updates on error
      if (context && 'invalidateQueries' in context) {
        const ctx = context as any;
        if (ctx.invalidateQueries) {
          await Promise.all(
            ctx.invalidateQueries.map((query: string) => 
              queryClient.invalidateQueries({ queryKey: [query] })
            )
          );
        }
      }
      
      // Call original onError if provided
      if (mutationOptions.onError) {
        mutationOptions.onError(error, variables, context);
      }
    },
    meta: {
      ...mutationOptions.meta,
      entityType,
    },
  });
}

// Prefetch hook
export function usePrefetch(entityType: string) {
  const queryClient = useQueryClient();
  
  return async (queryKey: readonly unknown[], queryFn: () => Promise<unknown>) => {
    const cacheKey = queryKey.join(':');
    const cached = await cacheManager.get(cacheKey, entityType);
    
    if (!cached) {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        meta: { entityType },
      });
    }
  };
}

// Cache stats hook
export function useCacheStats() {
  return cacheManager.getStats();
}

// Cache control hook
export function useCacheControl() {
  const queryClient = useQueryClient();
  
  return {
    invalidateEntity: (entityType: string, entityId?: string) => {
      cacheManager.invalidateEntity(entityType, entityId);
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.meta?.entityType === entityType &&
          (!entityId || query.queryKey.includes(entityId))
      });
    },
    
    invalidatePattern: (pattern: string) => {
      cacheManager.invalidate(pattern);
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = Array.isArray(query.queryKey) 
            ? query.queryKey.join(':') 
            : String(query.queryKey);
          return new RegExp(pattern).test(key);
        },
      });
    },
    
    clearCache: () => {
      cacheManager.clear();
      queryClient.clear();
    },
    
    preload: async (entities: string[]) => {
      await cacheManager.preload(entities);
    },
  };
}