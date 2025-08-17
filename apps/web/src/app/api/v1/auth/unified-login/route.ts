import { NextRequest, NextResponse } from 'next/server';
import { unifiedAuthService, detectClientType, ClientType } from '@repo/auth';
import { z } from 'zod';

// Validation schema
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  rememberMe: z.boolean().optional()
});

/**
 * Unified login endpoint that handles both web and mobile authentication
 * POST /api/v1/auth/unified-login
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
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

    const { identifier, password, deviceId, deviceName, rememberMe } = validationResult.data;

    // Detect client type
    const clientType = detectClientType(request);

    // Mobile clients must provide device ID
    if (clientType === ClientType.MOBILE && !deviceId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Device ID is required for mobile authentication' 
        },
        { status: 400 }
      );
    }

    // Extract headers for security context
    const headers: Record<string, string | undefined> = {
      'user-agent': request.headers.get('user-agent') || undefined,
      'x-forwarded-for': request.headers.get('x-forwarded-for') || undefined,
      'x-real-ip': request.headers.get('x-real-ip') || undefined,
    };

    // Authenticate using unified service
    const result = await unifiedAuthService.authenticate(
      {
        identifier,
        password,
        clientType,
        deviceId,
        deviceName
      },
      clientType,
      headers
    );

    // Handle failed authentication
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.authData.message || 'Authentication failed' 
        },
        { status: 401 }
      );
    }

    // Prepare response based on client type
    const response = NextResponse.json(result.authData);

    // For web clients, NextAuth handles session cookies automatically
    // For mobile clients, tokens are returned in the response body

    return response;
  } catch (error) {
    console.error('Unified login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}