import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getSanitizedUser, getCorsHeaders } from '@repo/auth';
import type { SessionResponse } from '@repo/shared/types';

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    
    if (!authResult.authenticated || !authResult.user) {
      const response: SessionResponse = {
        success: true,
        user: null,
        isAuthenticated: false,
      };
      return NextResponse.json(response);
    }
    
    // Get sanitized user data
    const userDTO = getSanitizedUser(authResult.user);
    
    const response: SessionResponse = {
      success: true,
      user: userDTO,
      isAuthenticated: true,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Session error:', error);
    const response: SessionResponse = {
      success: false,
      user: null,
      isAuthenticated: false,
    };
    return NextResponse.json(response);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}