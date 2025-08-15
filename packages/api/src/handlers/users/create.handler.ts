import { prisma } from '@repo/database';
import { hashPassword } from '@repo/auth';
import { ApiResponse } from '../../responses';
import { ApiError } from '../../errors';
import { CreateUserInput } from '../../validators';
import { logger } from '../../middleware';

export async function createUserHandler(input: CreateUserInput): Promise<Response> {
  try {
    const { email, phone, firstName, lastName, role, password, isActive = true } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ApiError('User with this email already exists', 'DUPLICATE_EMAIL', 409);
      }
      if (existingUser.phone === phone) {
        throw new ApiError('User with this phone already exists', 'DUPLICATE_PHONE', 409);
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        firstName,
        lastName,
        role,
        password: hashedPassword,
        isActive
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    logger.info('User created successfully', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const responseData = ApiResponse.created(user);

    return new Response(JSON.stringify(responseData), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Create user handler error', error as Error, {
      email: input.email,
      role: input.role
    });
    throw error;
  }
}