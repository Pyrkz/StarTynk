import { createTRPCReact } from '@trpc/react-query';
import { 
  httpBatchLink, 
  httpLink, 
  loggerLink,
  splitLink
} from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from './root';

/**
 * Create tRPC React hooks
 */
export const trpc = createTRPCReact<AppRouter>();


/**
 * Create standalone tRPC client for server-side usage
 */
export function createTRPCClient(opts?: {
  url?: string;
  headers?: Record<string, string>;
}) {
  return trpc.createClient({
    links: [
      loggerLink({
        enabled: () => process.env.NODE_ENV === 'development',
      }),
      httpBatchLink({
        url: opts?.url || '/api/trpc',
        transformer: superjson,
        headers: opts?.headers || {},
      }),
    ],
  });
}

/**
 * Create mobile tRPC client with offline support
 */
export function createMobileTRPCClient(opts: {
  url: string;
  getAuthToken: () => Promise<string | null>;
}) {
  return trpc.createClient({
    links: [
      loggerLink({
        enabled: () => process.env.NODE_ENV === 'development',
      }),
      httpBatchLink({
          url: opts.url,
          transformer: superjson,
          async headers() {
            const token = await opts.getAuthToken();
            return {
              'x-trpc-source': 'mobile',
              'authorization': token ? `Bearer ${token}` : '',
            };
          },
          fetch: async (url, options) => {
            // Add timeout for mobile networks
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            
            try {
              const response = await fetch(url, {
                ...options,
                signal: controller.signal,
              });
              return response;
            } finally {
              clearTimeout(timeout);
            }
          },
        }),
    ],
  });
}


// Re-export for convenience
export type { AppRouter } from './root';