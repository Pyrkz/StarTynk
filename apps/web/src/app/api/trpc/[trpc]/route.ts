import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';
import { appRouter, createContext } from '@repo/trpc';

/**
 * tRPC API handler for Next.js App Router
 * Handles all tRPC requests at /api/trpc/*
 */
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req: req as any, res: undefined as any }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, error);
          }
        : undefined,
    responseMeta(opts) {
      const { ctx, paths, type, errors } = opts;
      
      // Cache headers for queries
      if (type === 'query' && errors.length === 0) {
        const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
        return {
          headers: {
            'cache-control': `s-maxage=1, stale-while-revalidate=${ONE_DAY_IN_SECONDS}`,
          },
        };
      }
      
      return {};
    },
  });

export { handler as GET, handler as POST };