import { NextRequest } from 'next/server';
import {
  getProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  validateParams,
  validateBody,
  getProjectSchema,
  updateProjectSchema,
  deleteProjectSchema,
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
      const validateInput = validateParams(getProjectSchema);
      const input = validateInput(params);

      // Execute business logic
      return await getProjectHandler(input);

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
      const validateParamsInput = validateParams(getProjectSchema);
      const paramInput = validateParamsInput(params);

      // Validate request body
      const validateBodyInput = validateBody(updateProjectSchema);
      const bodyInput = await validateBodyInput(req);

      // Execute business logic
      return await updateProjectHandler(paramInput.id, bodyInput);

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
      const validateInput = validateParams(deleteProjectSchema);
      const input = validateInput(params);

      // Execute business logic
      return await deleteProjectHandler(input);

    } catch (error) {
      return await errorHandler(error, req);
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  return defaultCors(request) || new Response(null, { status: 200 });
}