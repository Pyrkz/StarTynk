import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, hasRequiredRole, type AuthUser } from '@/lib/auth/middleware';
import { ApiResponse } from './response';
import { handleApiError } from './error-handler';
import { Role } from '@repo/shared';

export type RouteContext = {
  params: Record<string, string>;
};

export type ProtectedRouteHandler = (
  request: NextRequest,
  context: RouteContext,
  user: AuthUser
) => Promise<NextResponse>;

export interface ProtectedRouteOptions {
  roles?: Role[];
}

/**
 * Creates a protected route handler that requires authentication
 * @param handler The route handler function
 * @param options Optional configuration (e.g., required roles)
 * @returns Wrapped handler with authentication
 */
export function protectedRoute(
  handler: ProtectedRouteHandler,
  options?: ProtectedRouteOptions
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      // Convert NextRequest to standard Request for auth middleware
      const standardRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      // Authenticate the request
      const auth = await authenticateToken(standardRequest);
      
      if (auth.error) {
        return ApiResponse.error(auth.error, auth.status || 401);
      }

      if (!auth.user) {
        return ApiResponse.unauthorized();
      }

      // Check role permissions if specified
      if (options?.roles && options.roles.length > 0) {
        if (!hasRequiredRole(auth.user.role, options.roles)) {
          return ApiResponse.forbidden('Insufficient permissions');
        }
      }

      // Call the actual handler with the authenticated user
      return await handler(request, context, auth.user);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Creates a public route handler with error handling
 * @param handler The route handler function
 * @returns Wrapped handler with error handling
 */
export function publicRoute(
  handler: (request: NextRequest, context: RouteContext) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Helper to extract and validate route params
 * @param context Route context
 * @param paramName Parameter name to extract
 * @returns Parameter value
 * @throws Error if parameter is missing
 */
export function getRouteParam(context: RouteContext, paramName: string): string {
  const value = context.params[paramName];
  if (!value) {
    throw new Error(`Missing required parameter: ${paramName}`);
  }
  return value;
}