import { prisma } from '@repo/database';
import { refreshAccessToken } from '@repo/auth';
import { ApiResponse } from '../../responses';
import { AuthError } from '../../errors';
import type { RefreshTokenInput } from '../../validators';
import { logger } from '../../middleware';

export async function refreshHandler(input: RefreshTokenInput): Promise<Response> {
  try {
    const { refreshToken } = input;

    // Validate refresh token exists in database
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: true
      }
    });

    if (!tokenRecord || !tokenRecord.user) {
      logger.warn('Invalid or expired refresh token');
      throw new AuthError('Invalid or expired refresh token');
    }

    // Check if user is still active
    if (!tokenRecord.user.isActive) {
      logger.warn('Refresh token blocked for inactive user', { userId: tokenRecord.user.id });
      throw new AuthError('Account is inactive');
    }

    // Generate new access token using auth package
    try {
      const newTokens = await refreshAccessToken(refreshToken);

      logger.info('Token refresh successful', { userId: tokenRecord.user.id });

      const responseData = ApiResponse.success({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        user: {
          id: tokenRecord.user.id,
          email: tokenRecord.user.email,
          name: tokenRecord.user.name || '',
          role: tokenRecord.user.role,
          isActive: tokenRecord.user.isActive
        }
      });

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (authError) {
      logger.error('Token refresh failed', authError as Error, { userId: tokenRecord.user.id });
      throw new AuthError('Failed to refresh token');
    }

  } catch (error) {
    logger.error('Refresh handler error', error as Error);
    throw error;
  }
}