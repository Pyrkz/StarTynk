import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAuthService } from '@repo/auth';
import { detectClient, createUnifiedResponse, createErrorResponse } from '@/middleware/client-detection';

// Validation schema
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  deviceId: z.string().optional(),
});

/**
 * Unified token refresh endpoint (primarily for mobile)
 * POST /api/v1/auth/unified-refresh - Refresh access token
 */
export async function POST(request: NextRequest) {
  const clientInfo = detectClient(request);
  
  // Web clients typically use session refresh, not token refresh
  if (clientInfo.type === 'web') {
    return createErrorResponse(
      'Token refresh not supported for web clients',
      clientInfo,
      400
    );
  }
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = refreshSchema.parse(body);
    
    // Perform token refresh using unified auth service
    const authService = createAuthService();
    const result = await authService.refreshToken(validatedData);
    
    if (!result.success) {
      return createErrorResponse(
        result.error || 'Token refresh failed',
        clientInfo,
        401
      );
    }
    
    const responseData = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    };
    
    return createUnifiedResponse(responseData, clientInfo, {
      status: 200,
      message: 'Token refreshed successfully',
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
        clientInfo,
        400
      );
    }
    
    return createErrorResponse(
      'Internal server error',
      clientInfo,
      500
    );
  }
}