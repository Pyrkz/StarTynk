import { NextRequest } from 'next/server';
import {
  listProjectsHandler,
  createProjectHandler,
  validateQuery,
  validateBody,
  listProjectsSchema,
  createProjectSchema,
  standardRateLimit,
  errorHandler,
  loggingMiddleware,
  defaultCors
} from '@repo/api';

export async function GET(request: NextRequest) {
  return loggingMiddleware(request, async (req) => {
    try {
      // Handle CORS
      const corsResponse = defaultCors(req);
      if (corsResponse) return corsResponse;

      // Apply rate limiting
      await standardRateLimit(req);

      // Validate query parameters
      const validateInput = validateQuery(listProjectsSchema);
      const input = await validateInput(req);

      // Execute business logic
      return await listProjectsHandler(input);

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
      const validateInput = validateBody(createProjectSchema);
      const input = await validateInput(req);

      // Execute business logic
      return await createProjectHandler(input);

    } catch (error) {
      return await errorHandler(error, req);
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  return defaultCors(request) || new Response(null, { status: 200 });
}