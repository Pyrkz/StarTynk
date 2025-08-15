import { prisma } from '@repo/database';
import { authenticateRequest } from '@repo/auth';
import { ApiResponse } from '../../responses';
import { AuthError } from '../../errors';
import { LoginInput } from '../../validators';
import { logger } from '../../middleware';

export async function loginHandler(input: LoginInput): Promise<Response> {
  try {
    // Validate credentials using auth package
    const authResult = await authenticateRequest({
      email: input.email,
      phone: input.phone,
      password: input.password,
    });

    if (!authResult.authenticated || !authResult.user) {
      logger.warn('Login attempt failed', {
        method: input.loginMethod,
        identifier: input.email || input.phone,
        reason: 'Invalid credentials'
      });
      
      throw new AuthError('Invalid credentials');
    }

    const user = authResult.user;

    // Check if user is active
    if (!user.isActive) {
      logger.warn('Login blocked for inactive user', { userId: user.id });
      throw new AuthError('Account is inactive');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Log successful login
    logger.info('User login successful', {
      userId: user.id,
      method: input.loginMethod
    });

    // Return user data with tokens (tokens are handled by auth package)
    const responseData = ApiResponse.success({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      },
      tokens: authResult.tokens
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