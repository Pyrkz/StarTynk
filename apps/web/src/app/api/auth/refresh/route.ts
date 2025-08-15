import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/lib/api/response';
import { publicRoute } from '@/lib/api/protected-route';
import { validateRequestBody, sanitizeUser } from '@/lib/api/validators';
import { verifyRefreshToken, generateTokenPair } from '@/lib/auth/jwt';
import { createUserActivityLog } from '@/features/auth/utils/activity-logger';

// Validation schema for refresh token
const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const POST = publicRoute(async (request: NextRequest) => {
  // Validate request body
  const body = await validateRequestBody(request, refreshSchema);
  
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(body.refreshToken);
    
    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: body.refreshToken },
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
      return ApiResponse.forbidden('Account is inactive');
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role as any
    );

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id }
    });

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Log token refresh
    await createUserActivityLog({
      userId: storedToken.user.id,
      action: 'TOKEN_REFRESH',
      details: { method: 'mobile' }
    });

    // Return new tokens with user data
    return ApiResponse.success({
      user: sanitizeUser(storedToken.user),
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error instanceof Error) {
      return ApiResponse.unauthorized(error.message);
    }
    throw error;
  }
});