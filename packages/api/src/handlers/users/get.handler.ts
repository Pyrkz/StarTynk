import { prisma } from '@repo/database';
import { ApiResponse } from '../../responses';
import { UserNotFoundError } from '../../errors';
import type { GetUserInput } from '../../validators';
import { logger } from '../../middleware';

export async function getUserHandler(input: GetUserInput): Promise<Response> {
  try {
    const { id } = input;

    // First get the basic user info
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        coordinatedProjects: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            createdProjects: true,
            coordinatedProjects: true
          }
        }
      }
    });

    if (!user) {
      throw new UserNotFoundError(id);
    }

    // Get developed projects through Project model
    // Use type assertion to bypass TypeScript issue
    const developedProjects = await prisma.project.findMany({
      where: { 
        userDeveloperId: id 
      } as any,
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Count developed projects
    const developedProjectsCount = await prisma.project.count({
      where: { userDeveloperId: id } as any
    });

    logger.info('User retrieved', { userId: id });

    // Create response object with all data
    const responseData = ApiResponse.success({
      ...user,
      developedProjects,
      _count: {
        ...user._count,
        developedProjects: developedProjectsCount
      }
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Get user handler error', error as Error, { userId: input.id });
    throw error;
  }
}