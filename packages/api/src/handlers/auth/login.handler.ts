import { prisma } from '@repo/database';
import { authenticateRequest } from '@repo/auth';
import { ApiResponse } from '../../responses';
import { AuthError } from '../../errors';
import type { LoginInput } from '../../validators';
import { logger } from '../../middleware';

export async function loginHandler(input: LoginInput): Promise<Response> {
  try {
    // Validate credentials using auth package
    const credentials: any = { password: input.password };
    if (input.loginMethod === 'email' && input.email) {
      credentials.email = input.email;
    } else if (input.loginMethod === 'phone' && input.phone) {
      credentials.phone = input.phone;
    }
    
    const authResult = await authenticateRequest(credentials);

    if (!authResult.authenticated || !authResult.user) {
      logger.warn('Login attempt failed', {
        method: input.loginMethod,
        identifier: input.email || input.phone,
        reason: 'Invalid credentials'
      });
      
      throw new AuthError('Invalid credentials');
    }

    const user = authResult.user;

    // Get full user data from database to check if active
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId }
    });

    if (!dbUser || !dbUser.isActive) {
      logger.warn('Login blocked for inactive user', { userId: user.userId });
      throw new AuthError('Account is inactive');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.userId },
      data: { lastLoginAt: new Date() }
    });

    // Log successful login
    logger.info('User login successful', {
      userId: user.userId,
      method: input.loginMethod
    });

    // Return user data with tokens (tokens are handled by auth package)
    const responseData = ApiResponse.success({
      user: {
        id: dbUser.id,
        email: user.email,
        name: dbUser.name || '',
        role: user.role,
        isActive: dbUser.isActive
      },
      tokens: (authResult as any).accessToken ? { accessToken: (authResult as any).accessToken, refreshToken: (authResult as any).refreshToken } : undefined
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Login handler error', error as Error, {
      method: input.loginMethod,
      identifier: input.email || input.phone
    });
    throw error;
  }
}