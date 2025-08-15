import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { detectClientType } from '@/lib/auth/unified-auth';
import type { SessionResponse } from '@repo/shared/types';

export async function GET(request: NextRequest) {
  try {
    // Detect client type
    const clientType = detectClientType(request);
    
    // Get current user
    const user = await authenticateRequest(request);
    
    if (!user) {
      const response: SessionResponse = {
        success: true,
        user: null,
        isAuthenticated: false,
      };
      return NextResponse.json(response);
    }
    
    // Prepare user DTO
    const userDTO = {
      id: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      name: user.name || undefined,
      role: user.role,
      emailVerified: !!user.emailVerified,
      phoneVerified: !!user.phoneVerified,
    };
    
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
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Type',
    },
  });
}