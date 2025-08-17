import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { unifiedAuthService, detectClientType, ClientType } from '@repo/auth';

// Validation schema
const refreshSchema = z.object({
  refreshToken: z.string().optional(), // For mobile
  deviceId: z.string().optional() // For mobile
});

/**
 * Unified token/session refresh endpoint
 * POST /api/v1/auth/unified-refresh
 */
export async function POST(request: NextRequest) {
  try {
    // Detect client type
    const clientType = detectClientType(request);

    if (clientType === ClientType.MOBILE) {
      // Parse request body for mobile
      const body = await request.json();
      
      // Validate input
      const validationResult = refreshSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid request data',
            details: validationResult.error.errors 
          },
          { status: 400 }
        );
      }

      const { refreshToken, deviceId } = validationResult.data;

      if (!refreshToken || !deviceId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Refresh token and device ID are required' 
          },
          { status: 400 }
        );
      }

      // Refresh mobile tokens
      const result = await unifiedAuthService.refreshAuth(
        refreshToken,
        clientType,
        deviceId
      );

      if (!result.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: result.message || 'Token refresh failed' 
          },
          { status: 401 }
        );
      }

      // Return new tokens
      return NextResponse.json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        tokenType: 'Bearer'
      });
    } else {
      // Web session refresh
      // NextAuth handles this automatically, but we can extend the session
      const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                         request.cookies.get('__Secure-next-auth.session-token')?.value;

      if (!sessionToken) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No session found' 
          },
          { status: 401 }
        );
      }

      const result = await unifiedAuthService.refreshAuth(
        sessionToken,
        clientType
      );

      return NextResponse.json({
        success: result.success,
        message: result.message || 'Session extended'
      });
    }
  } catch (error) {
    console.error('Unified refresh error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}