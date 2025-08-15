import { NextRequest } from 'next/server';
import {
  refreshHandler,
  validateBody,
  refreshTokenSchema,
  authRateLimit,
  errorHandler,
  loggingMiddleware,
  defaultCors
} from '@repo/api';

export async function POST(request: NextRequest) {
  return loggingMiddleware(request, async (req) => {
    try {
      // Handle CORS
      const corsResponse = defaultCors(req);
      if (corsResponse) return corsResponse;

      // Apply rate limiting
      await authRateLimit(req);

      // Validate request body
      const validateInput = validateBody(refreshTokenSchema);
      const input = await validateInput(req);

      // Execute business logic
      return await refreshHandler(input);

    } catch (error) {
      return await errorHandler(error, req);
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  return defaultCors(request) || new Response(null, { status: 200 });
}