import { prisma, ProjectStatus } from '@repo/database';
import { ApiResponse } from '../../responses';
import { ApiError, UserNotFoundError } from '../../errors';
import type { DeleteUserInput } from '../../validators';
import { logger } from '../../middleware';

export async function deleteUserHandler(input: DeleteUserInput): Promise<Response> {
  try {
    const { id } = input;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new UserNotFoundError(id);
    }

    // Check if user has active projects (simplified for now)
    const activeProjects = await prisma.project.findMany({
      where: {
        AND: [
          { coordinatorId: id },
          { status: { in: [ProjectStatus.PLANNING, ProjectStatus.ACTIVE] } }
        ]
      }
    });

    if (activeProjects.length > 0) {
      throw new ApiError(
        'Cannot delete user with active projects. Please reassign or complete projects first.',
        'USER_HAS_ACTIVE_PROJECTS',
        409,
        {
          activeProjectsCount: activeProjects.length
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
        name: true,
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