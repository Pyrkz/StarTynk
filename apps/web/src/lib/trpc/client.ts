import { createTRPCReact } from '@trpc/react-query';
import { createTRPCNext } from '@trpc/next';
import { 
  httpBatchLink, 
  httpLink,
  loggerLink,
  splitLink,
} from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@repo/trpc';

/**
 * Create tRPC React hooks
 */
const trpc = createTRPCReact<AppRouter>();

/**
 * Get base URL for API calls
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // Vercel
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

/**
 * Create tRPC client for client-side usage
 */
export function createTRPCClient() {
  return trpc.createClient({
    transformer: superjson,
    links: [
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === 'development' ||
          (opts.direction === 'down' && opts.result instanceof Error),
      }),
      splitLink({
        condition(op) {
          // Use batch link for queries, regular link for mutations/subscriptions
          return op.type === 'query';
        },
        true: httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          maxBatchSize: 10,
          maxBatchTime: 50, // ms
          headers() {
            return {
              'x-trpc-source': 'web-client',
            };
          },
        }),
        false: httpLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return {
              'x-trpc-source': 'web-client',
            };
          },
        }),
      }),
    ],
  });
}

/**
 * Create tRPC client for SSR usage
 */
export function createTRPCSSRClient() {
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        headers() {
          return {
            'x-trpc-source': 'web-ssr',
          };
        },
      }),
    ],
  });
}

/**
 * tRPC Next.js utilities with SSR support
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
 * Type helpers for router inputs and outputs
 */
export type RouterInputs = typeof trpc extends createTRPCReact<infer T> ? T : never;
export type RouterOutputs = typeof trpc extends createTRPCReact<infer T> ? T : never;