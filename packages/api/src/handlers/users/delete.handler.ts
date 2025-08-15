import { prisma } from '@repo/database';
import { ApiResponse } from '../../responses';
import { ApiError, UserNotFoundError } from '../../errors';
import { DeleteUserInput } from '../../validators';
import { logger } from '../../middleware';

export async function deleteUserHandler(input: DeleteUserInput): Promise<Response> {
  try {
    const { id } = input;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        developedProjects: { where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } } },
        coordinatedProjects: { where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } } }
      }
    });

    if (!existingUser) {
      throw new UserNotFoundError(id);
    }

    // Check if user has active projects
    const hasActiveProjects = existingUser.developedProjects.length > 0 || 
                             existingUser.coordinatedProjects.length > 0;

    if (hasActiveProjects) {
      throw new ApiError(
        'Cannot delete user with active projects. Please reassign or complete projects first.',
        'USER_HAS_ACTIVE_PROJECTS',
        409,
        {
          activeProjectsCount: existingUser.developedProjects.length + existingUser.coordinatedProjects.length,
          developedProjects: existingUser.developedProjects.length,
          coordinatedProjects: existingUser.coordinatedProjects.length
        }
      );
    }

    // Soft delete by deactivating the user instead of hard delete
    // This preserves historical data integrity
    const deletedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        // Anonymize email to prevent conflicts
        email: `deleted_${id}@deleted.local`,
        phone: null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        deletedAt: true
      }
    });

    // Also invalidate all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: id }
    });

    logger.info('User soft deleted successfully', {
      userId: id,
      email: existingUser.email
    });

    const responseData = ApiResponse.success({
      message: 'User deleted successfully',
      user: deletedUser
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Delete user handler error', error as Error, { userId: input.id });
    throw error;
  }
}