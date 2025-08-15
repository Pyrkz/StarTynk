import { NextRequest, NextResponse } from 'next/server';
import { detectClientType, clearSession } from '@/lib/auth/unified-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { authenticateRequest } from '@/lib/auth/middleware';
import { logUserActivity } from '@/features/auth/utils/activity-logger';
import type { LogoutResponse } from '@repo/shared/types';

export async function POST(request: NextRequest) {
  try {
    // Detect client type
    const clientType = detectClientType(request);
    
    // Get current user
    const user = await authenticateRequest(request);
    
    if (user) {
      // Log logout activity
      await logUserActivity({
        userId: user.id,
        action: 'LOGOUT',
        details: JSON.stringify({ clientType }),
        ipAddress: request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || undefined,
        userAgent: request.headers.get('User-Agent') || undefined,
      });
    }
    
    // Clear session based on client type
    await clearSession(request, clientType);
    
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
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Type',
    },
  });
}