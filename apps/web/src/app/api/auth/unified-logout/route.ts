import { NextRequest, NextResponse } from 'next/server';
import { 
  detectClientType, 
  authenticateRequest,
  revokeAllUserTokens,
  getCorsHeaders,
  JWTAuthProvider,
  SessionAuthProvider
} from '@repo/auth';
import { ApiResponse } from '@/lib/api/api-response';
import type { LogoutResponse } from '@repo/shared/types';

export async function POST(request: NextRequest) {
  try {
    // Detect client type
    const clientType = detectClientType(request);
    
    // Get current user (optional - logout should work even if not authenticated)
    const authResult = await authenticateRequest(request);
    
    if (authResult.authenticated && authResult.user) {
      // Revoke tokens for mobile or clear session for web
      if (clientType === 'mobile') {
        await revokeAllUserTokens(authResult.user.id);
      } else {
        const sessionProvider = new SessionAuthProvider();
        await sessionProvider.clearSession(request);
      }
    } else if (clientType === 'mobile') {
      // For mobile, try to clear session anyway using the provider
      const jwtProvider = new JWTAuthProvider();
      await jwtProvider.clearSession(request);
    } else {
      // For web, clear session anyway
      const sessionProvider = new SessionAuthProvider();
      await sessionProvider.clearSession(request);
    }
    
    const response: LogoutResponse = {
      success: true,
      message: 'Logged out successfully',
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Logout error:', error);
    return ApiResponse.error('Logout failed');
  }
}

// GET method for web logout via link
export async function GET(request: NextRequest) {
  return POST(request);
}

// OPTIONS method for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    },
  });
}