import { createTRPCReact } from '@trpc/react-query';
import { createTRPCNext } from '@trpc/next';
import { 
  httpBatchLink, 
  httpLink, 
  loggerLink,
  unstable_httpBatchStreamLink,
  splitLink,
  type TRPCLink
} from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from './root';

/**
 * Create tRPC React hooks
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Create tRPC Next.js utilities  
 */
export const trpcNext = createTRPCNext<AppRouter>({
  config(opts) {
    const { ctx } = opts;
    
    if (typeof window !== 'undefined') {
      // Client-side
      return {
        transformer: superjson,
        links: [
          loggerLink({
            enabled: (opts) =>
              process.env.NODE_ENV === 'development' ||
              (opts.direction === 'down' && opts.result instanceof Error),
          }),
          splitLink({
            condition(op) {
              // Use batch link for queries, regular link for mutations
              return op.type === 'query';
            },
            true: httpBatchLink({
              url: '/api/trpc',
              maxBatchSize: 10,
              headers() {
                return {
                  'x-trpc-source': 'web-client',
                };
              },
            }),
            false: httpLink({
              url: '/api/trpc',
              headers() {
                return {
                  'x-trpc-source': 'web-client',
                };
              },
            }),
          }),
        ],
      };
    }

    // Server-side
    return {
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return {
              'x-trpc-source': 'web-ssr',
              // Forward cookies for SSR
              cookie: ctx?.req?.headers?.cookie,
            };
          },
        }),
      ],
    };
  },
  ssr: true,
});

/**
 * Create standalone tRPC client for server-side usage
 */
export function createTRPCClient(opts?: {
  url?: string;
  headers?: Record<string, string>;
}) {
  return trpc.createClient({
    transformer: superjson,
    links: [
      loggerLink({
        enabled: () => process.env.NODE_ENV === 'development',
      }),
      httpBatchLink({
        url: opts?.url || '/api/trpc',
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
    transformer: superjson,
    links: [
      loggerLink({
        enabled: () => __DEV__,
      }),
      splitLink({
        condition(op) {
          // Use streaming for subscriptions
          return op.type === 'subscription';
        },
        true: unstable_httpBatchStreamLink({
          url: opts.url,
          async headers() {
            const token = await opts.getAuthToken();
            return {
              'x-trpc-source': 'mobile',
              'authorization': token ? `Bearer ${token}` : '',
            };
          },
        }),
        false: httpBatchLink({
          url: opts.url,
          maxBatchSize: 5, // Smaller batches for mobile
          maxBatchTime: 100, // Faster batching for mobile responsiveness
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
      }),
    ],
  });
}

/**
 * Create retry link for mobile clients
 */
export function createRetryLink(): TRPCLink<AppRouter> {
  return (runtime) => {
    return ({ next, op }) => {
      return new Promise((resolve, reject) => {
        let attempt = 0;
        const maxRetries = 3;
        
        const tryRequest = () => {
          next(op).subscribe({
            next: resolve,
            error: (error) => {
              attempt++;
              
              // Retry on network errors or 5xx status codes
              const shouldRetry = 
                attempt < maxRetries && 
                (error.data?.code === 'TIMEOUT' || 
                 error.data?.code === 'INTERNAL_SERVER_ERROR' ||
                 error.data?.httpStatus >= 500);
              
              if (shouldRetry) {
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                setTimeout(tryRequest, delay);
              } else {
                reject(error);
              }
            },
          });
        };
        
        tryRequest();
      });
    };
  };
}

/**
 * Get base URL for tRPC calls
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // Vercel
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

/**
 * Type helpers for router inputs and outputs
 */
export type RouterInputs = typeof trpc extends createTRPCReact<infer T> ? T : never;
export type RouterOutputs = typeof trpc extends createTRPCReact<infer T> ? T : never;

// Re-export for convenience
export type { AppRouter } from './root';