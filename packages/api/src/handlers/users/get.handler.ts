import { prisma } from '@repo/database';
import { ApiResponse } from '../../responses';
import { UserNotFoundError } from '../../errors';
import { GetUserInput } from '../../validators';
import { logger } from '../../middleware';

export async function getUserHandler(input: GetUserInput): Promise<Response> {
  try {
    const { id } = input;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        developedProjects: {
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        coordinatedProjects: {
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            developedProjects: true,
            coordinatedProjects: true
          }
        }
      }
    });

    if (!user) {
      throw new UserNotFoundError(id);
    }

    logger.info('User retrieved', { userId: id });

    const responseData = ApiResponse.success(user);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Get user handler error', error as Error, { userId: input.id });
    throw error;
  }
}