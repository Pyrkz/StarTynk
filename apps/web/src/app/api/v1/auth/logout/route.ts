import { NextRequest } from 'next/server';
import {
  logoutHandler,
  standardRateLimit,
  errorHandler,
  loggingMiddleware,
  defaultCors
} from '@repo/api/web';

export async function POST(request: NextRequest) {
  return loggingMiddleware(request, async (req) => {
    try {
      // Handle CORS
      const corsResponse = defaultCors(req);
      if (corsResponse) return corsResponse;

      // Apply rate limiting
      await standardRateLimit(req);

      // Execute business logic
      return await logoutHandler(req);

    } catch (error) {
      return await errorHandler(error, req);
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  return defaultCors(request) || new Response(null, { status: 200 });
}