import { NextRequest, NextResponse } from 'next/server';
import { 
  rotateRefreshToken,
  createSecurityContext,
  extractDeviceId,
  getCorsHeaders,
  isMobileClient
} from '@repo/auth';
import { refreshTokenRequestSchema } from '@repo/shared/types';
import { ApiResponse } from '@/lib/api/api-response';
import type { RefreshTokenResponse } from '@repo/shared/types';

export async function POST(request: NextRequest) {
  try {
    // This endpoint is for mobile only
    if (!isMobileClient(request)) {
      return ApiResponse.badRequest('This endpoint is for mobile clients only');
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request
    const validation = refreshTokenRequestSchema.safeParse(body);
    if (!validation.success) {
      return ApiResponse.badRequest('Invalid request', validation.error.errors);
    }
    
    const { refreshToken, deviceId } = validation.data;
    
    // Create security context
    const securityContext = createSecurityContext({
      'user-agent': request.headers.get('user-agent') || undefined,
      'x-forwarded-for': request.headers.get('x-forwarded-for') || undefined,
      'x-real-ip': request.headers.get('x-real-ip') || undefined,
    }, deviceId || extractDeviceId(request));
    
    // Rotate refresh token
    const result = await rotateRefreshToken(refreshToken, securityContext);
    
    if (!result.success) {
      return ApiResponse.unauthorized(result.error || 'Token refresh failed');
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return ApiResponse.error('Token refresh failed');
  }
}

// OPTIONS method for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}