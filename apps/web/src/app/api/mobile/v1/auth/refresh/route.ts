import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@repo/database';
import { verifyRefreshToken, verifyRefreshTokenInDb, createTokens, createSecurityContext } from '@repo/auth';
import { ApiResponse } from '@repo/api/responses';
import { Logger } from '@repo/utils/logger';

const logger = new Logger('MobileTokenRefresh');

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = refreshTokenSchema.parse(body);
    
    // Verify refresh token format
    await verifyRefreshToken(refreshToken);
    
    // Verify refresh token exists in database
    const { user, refreshToken: tokenRecord } = await verifyRefreshTokenInDb(refreshToken);
    
    // Create security context
    const securityContext = createSecurityContext(
      Object.fromEntries(request.headers.entries()),
      tokenRecord.deviceId || undefined,
      user.email ? 'email' : 'phone'
    );
    
    // Create new tokens
    const tokens = await createTokens(user, securityContext);
    
    // Invalidate old refresh token
    await prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });
    
    logger.info(`Token refresh successful for user: ${user.id}`);
    
    return NextResponse.json(
      ApiResponse.success({
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Token refresh validation error:', error.errors);
      return NextResponse.json(
        ApiResponse.error('Invalid request data', 'VALIDATION_ERROR', error.errors),
        { status: 400 }
      );
    }
    
    logger.warn('Token refresh failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      ApiResponse.error('Token refresh failed', 'REFRESH_ERROR'),
      { status: 401 }
    );
  }
}