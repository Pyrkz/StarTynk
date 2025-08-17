import { NextRequest } from 'next/server';
import {
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
  validateParams,
  validateBody,
  getUserSchema,
  updateUserSchema,
  deleteUserSchema,
  standardRateLimit,
  errorHandler,
  loggingMiddleware,
  defaultCors
} from '@repo/api/web';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return loggingMiddleware(request, async (req) => {
    try {
      // Handle CORS
      const corsResponse = defaultCors(req);
      if (corsResponse) return corsResponse;

      // Apply rate limiting
      await standardRateLimit(req);

      // Validate parameters
      const validateInput = validateParams(getUserSchema);
      const input = validateInput(params);

      // Execute business logic
      return await getUserHandler(input);

    } catch (error) {
      return await errorHandler(error, req);
    }
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return loggingMiddleware(request, async (req) => {
    try {
      // Handle CORS
      const corsResponse = defaultCors(req);
      if (corsResponse) return corsResponse;

      // Apply rate limiting
      await standardRateLimit(req);

      // Validate parameters
      const validateParamsInput = validateParams(getUserSchema);
      const paramInput = validateParamsInput(params);

      // Validate request body
      const validateBodyInput = validateBody(updateUserSchema);
      const bodyInput = await validateBodyInput(req);

      // Execute business logic
      return await updateUserHandler(paramInput.id, bodyInput);

    } catch (error) {
      return await errorHandler(error, req);
    }
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return loggingMiddleware(request, async (req) => {
    try {
      // Handle CORS
      const corsResponse = defaultCors(req);
      if (corsResponse) return corsResponse;

      // Apply rate limiting
      await standardRateLimit(req);

      // Validate parameters
      const validateInput = validateParams(deleteUserSchema);
      const input = validateInput(params);

      // Execute business logic
      return await deleteUserHandler(input);

    } catch (error) {
      return await errorHandler(error, req);
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  return defaultCors(request) || new Response(null, { status: 200 });
}