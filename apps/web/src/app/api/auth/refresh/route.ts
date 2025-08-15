import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { z } from 'zod';
import { verifyToken, createTokens } from '@/lib/auth/unified-auth';
import { refreshTokenRequestSchema } from '@repo/shared/types';
import { ApiResponse } from '@/lib/api/api-response';
import { logUserActivity } from '@/features/auth/utils/activity-logger';
import type { RefreshTokenResponse } from '@repo/shared/types';

export async function POST(request: NextRequest) {
  try {
    // This endpoint is for mobile only
    const clientType = request.headers.get('X-Client-Type');
    if (clientType === 'web') {
      return ApiResponse.badRequest('Web clients should use session-based authentication');
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request
    const validation = refreshTokenRequestSchema.safeParse(body);
    if (!validation.success) {
      return ApiResponse.badRequest('Invalid request', validation.error.errors);
    }
    
    const { refreshToken, deviceId } = validation.data;
    
    try {
      // Verify refresh token
      const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
      const payload = verifyToken(refreshToken, refreshSecret) as any;
      
      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });
      
      if (!storedToken) {
        return ApiResponse.unauthorized('Invalid refresh token');
      }
      
      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        // Delete expired token
        await prisma.refreshToken.delete({
          where: { id: storedToken.id }
        });
        
        return ApiResponse.unauthorized('Refresh token has expired');
      }
      
      // Check if user is still active
      if (!storedToken.user.isActive) {
        return ApiResponse.forbidden('Account is deactivated');
      }
      
      // Delete old refresh token (rotation)
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });
      
      // Generate new token pair
      const tokens = await createTokens(
        storedToken.user, 
        deviceId || storedToken.deviceId || undefined,
        storedToken.loginMethod as any,
        request
      );
      
      // Log token refresh
      await logUserActivity({
        userId: storedToken.user.id,
        action: 'TOKEN_REFRESH',
        details: JSON.stringify({ 
          deviceId,
          loginMethod: storedToken.loginMethod 
        }),
        ipAddress: request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || undefined,
        userAgent: request.headers.get('User-Agent') || undefined,
      });
      
      const response: RefreshTokenResponse = {
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      };
      
      return NextResponse.json(response);
      
    } catch (error) {
      // Token verification failed
      return ApiResponse.unauthorized('Invalid or expired refresh token');
    }
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return ApiResponse.error('Token refresh failed');
  }
}

// OPTIONS method for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Type',
    },
  });
}