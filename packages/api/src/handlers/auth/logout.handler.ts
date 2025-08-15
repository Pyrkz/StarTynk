import { prisma } from '@repo/database';
import { ApiResponse } from '../../responses';
import { AuthError } from '../../errors';
import { logger } from '../../middleware';

export async function logoutHandler(request: Request): Promise<Response> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.slice(7);

    // Invalidate refresh token in database
    try {
      await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { token },
            { accessToken: token }
          ]
        }
      });
    } catch (error) {
      logger.warn('Failed to delete refresh token during logout', { error });
    }

    logger.info('User logout successful');

    const responseData = ApiResponse.success({
      message: 'Logged out successfully'
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Logout handler error', error as Error);
    throw error;
  }
}