import { NextRequest } from 'next/server';
import {
  listUsersHandler,
  createUserHandler,
  validateQuery,
  validateBody,
  listUsersSchema,
  createUserSchema,
  standardRateLimit,
  errorHandler,
  loggingMiddleware,
  defaultCors
} from '@repo/api/web';

export async function GET(request: NextRequest) {
  return loggingMiddleware(request, async (req) => {
    try {
      // Handle CORS
      const corsResponse = defaultCors(req);
      if (corsResponse) return corsResponse;

      // Apply rate limiting
      await standardRateLimit(req);

      // Validate query parameters
      const validateInput = validateQuery(listUsersSchema);
      const input = await validateInput(req);

      // Execute business logic
      return await listUsersHandler(input);

    } catch (error) {
      return await errorHandler(error, req);
    }
  });
}

export async function POST(request: NextRequest) {
  return loggingMiddleware(request, async (req) => {
    try {
      // Handle CORS
      const corsResponse = defaultCors(req);
      if (corsResponse) return corsResponse;

      // Apply rate limiting
      await standardRateLimit(req);

      // Validate request body
      const validateInput = validateBody(createUserSchema);
      const input = await validateInput(req);

      // Execute business logic
      return await createUserHandler(input);

    } catch (error) {
      return await errorHandler(error, req);
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  return defaultCors(request) || new Response(null, { status: 200 });
}