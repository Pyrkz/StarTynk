import { 
  useMutation, 
  useQueryClient,
  UseMutationOptions,
  MutationFunction,
} from '@tanstack/react-query';

export interface OptimisticMutationOptions<TData, TVariables, TContext = unknown> {
  mutationKey: string[];
  mutationFn: MutationFunction<TData, TVariables>;
  onOptimisticUpdate?: (variables: TVariables) => TData | Promise<TData>;
  relatedQueries?: string[][];
  rollbackOnError?: boolean;
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

// Global notification handler (to be set by platform-specific code)
let showNotification: ((options: { type: string; message: string }) => void) | null = null;

export const setNotificationHandler = (handler: (options: { type: string; message: string }) => void) => {
  showNotification = handler;
};

export function useOptimisticMutation<TData = unknown, TVariables = unknown, TContext = unknown>(
  options: OptimisticMutationOptions<TData, TVariables, TContext>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables, TContext>({
    mutationKey: options.mutationKey,
    mutationFn: options.mutationFn,
    
    // Optimistic update
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      if (options.relatedQueries) {
        await Promise.all(
          options.relatedQueries.map(queryKey => 
            queryClient.cancelQueries({ queryKey })
          )
        );
      }

      // Snapshot previous values
      const previousData: Record<string, unknown> = {};
      
      if (options.relatedQueries) {
        for (const queryKey of options.relatedQueries) {
          previousData[queryKey.join(':')] = queryClient.getQueryData(queryKey);
        }
      }

      // Optimistically update
      if (options.onOptimisticUpdate) {
        const optimisticData = await options.onOptimisticUpdate(variables);
        
        // Update related queries with optimistic data
        if (options.relatedQueries) {
          for (const queryKey of options.relatedQueries) {
            queryClient.setQueryData(queryKey, (old: any) => {
              // Merge optimistic data with existing data
              if (Array.isArray(old)) {
                return [...old, optimisticData];
              }
              return { ...old, ...optimisticData };
            });
          }
        }
      }

      // Return context with previous data for rollback
      return { previousData } as TContext;
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (options.rollbackOnError !== false && context) {
        // Rollback to previous data
        const ctx = context as any;
        if (ctx.previousData) {
          for (const [key, data] of Object.entries(ctx.previousData)) {
            const queryKey = key.split(':');
            queryClient.setQueryData(queryKey, data);
          }
        }
      }

      // Show error message
      if (options.showErrorMessage !== false) {
        showNotification?.({
          type: 'error',
          message: options.errorMessage || error.message || 'Operation failed',
        });
      }
    },

    // Refetch on success
    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (options.relatedQueries) {
        for (const queryKey of options.relatedQueries) {
          queryClient.invalidateQueries({ queryKey });
        }
      }

      // Show success message
      if (options.showSuccessMessage) {
        showNotification?.({
          type: 'success',
          message: options.successMessage || 'Operation successful',
        });
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      if (options.relatedQueries) {
        for (const queryKey of options.relatedQueries) {
          queryClient.invalidateQueries({ queryKey });
        }
      }
    },
  });
}