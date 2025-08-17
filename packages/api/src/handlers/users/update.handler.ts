import { prisma, Role } from '@repo/database';
import { ApiResponse } from '../../responses';
import { ApiError, UserNotFoundError } from '../../errors';
import type { UpdateUserInput } from '../../validators';
import { logger } from '../../middleware';

export async function updateUserHandler(
  userId: string,
  input: UpdateUserInput
): Promise<Response> {
  try {
    const { email, phone, firstName, lastName, role, isActive } = input;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new UserNotFoundError(userId);
    }

    // Check for email/phone conflicts if they're being updated
    if (email || phone) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : [])
              ]
            }
          ]
        }
      });

      if (conflictUser) {
        if (conflictUser.email === email) {
          throw new ApiError('User with this email already exists', 'DUPLICATE_EMAIL', 409);
        }
        if (conflictUser.phone === phone) {
          throw new ApiError('User with this phone already exists', 'DUPLICATE_PHONE', 409);
        }
      }
    }

    // Update user - construct name from firstName/lastName if provided
    let updateData: any = {
      ...(email && { email }),
      ...(phone && { phone }),
      ...(role && { role: role as Role }),
      ...(typeof isActive === 'boolean' && { isActive }),
      updatedAt: new Date()
    };

    // Handle firstName/lastName by updating the combined name field
    if (firstName || lastName) {
      const nameParts = existingUser.name?.split(' ') || ['', ''];
      const currentFirstName = firstName || nameParts[0] || '';
      const currentLastName = lastName || nameParts[1] || '';
      
      updateData = {
        ...updateData,
        name: `${currentFirstName} ${currentLastName}`.trim()
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logger.info('User updated successfully', {
      userId,
      changes: Object.keys(input).filter(key => input[key as keyof UpdateUserInput] !== undefined)
    });

    const responseData = ApiResponse.success(updatedUser);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Update user handler error', error as Error, { userId, input });
    throw error;
  }
}