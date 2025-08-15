import { prisma } from '@repo/database';
import { ApiResponse } from '../../responses';
import { ApiError, ProjectNotFoundError, UserNotFoundError } from '../../errors';
import { UpdateProjectInput } from '../../validators';
import { logger } from '../../middleware';

export async function updateProjectHandler(
  projectId: string,
  input: UpdateProjectInput
): Promise<Response> {
  try {
    const {
      title,
      description,
      address,
      developerId,
      coordinatorId,
      startDate,
      endDate,
      budget,
      status
    } = input;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true
      }
    });

    if (!existingProject) {
      throw new ProjectNotFoundError(projectId);
    }

    // Validate status transitions
    if (status && status !== existingProject.status) {
      const validTransitions: Record<string, string[]> = {
        'PLANNING': ['IN_PROGRESS', 'CANCELLED'],
        'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': [], // Completed projects cannot be changed
        'CANCELLED': ['PLANNING'] // Can restart cancelled projects
      };

      if (!validTransitions[existingProject.status]?.includes(status)) {
        throw new ApiError(
          `Cannot transition from ${existingProject.status} to ${status}`,
          'INVALID_STATUS_TRANSITION',
          400
        );
      }
    }

    // Validate developer and coordinator if they're being updated
    if (developerId || coordinatorId) {
      const userChecks = [];
      
      if (developerId) {
        userChecks.push(
          prisma.user.findUnique({
            where: { id: developerId },
            select: { id: true, role: true, isActive: true }
          }).then(user => ({ type: 'developer', user, id: developerId }))
        );
      }
      
      if (coordinatorId) {
        userChecks.push(
          prisma.user.findUnique({
            where: { id: coordinatorId },
            select: { id: true, role: true, isActive: true }
          }).then(user => ({ type: 'coordinator', user, id: coordinatorId }))
        );
      }

      const userResults = await Promise.all(userChecks);

      for (const result of userResults) {
        if (!result.user) {
          throw new UserNotFoundError(result.id);
        }

        if (!result.user.isActive) {
          throw new ApiError(`${result.type} account is inactive`, `INACTIVE_${result.type.toUpperCase()}`, 400);
        }

        if (result.type === 'developer') {
          if (!['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN'].includes(result.user.role)) {
            throw new ApiError('Developer must have DEVELOPER, PROJECT_MANAGER, or ADMIN role', 'INVALID_DEVELOPER_ROLE', 400);
          }
        }

        if (result.type === 'coordinator') {
          if (!['COORDINATOR', 'PROJECT_MANAGER', 'ADMIN'].includes(result.user.role)) {
            throw new ApiError('Coordinator must have COORDINATOR, PROJECT_MANAGER, or ADMIN role', 'INVALID_COORDINATOR_ROLE', 400);
          }
        }
      }
    }

    // Validate dates
    const newStartDate = startDate ? new Date(startDate) : existingProject.startDate;
    const newEndDate = endDate ? new Date(endDate) : existingProject.endDate;

    if (newEndDate && newEndDate <= newStartDate) {
      throw new ApiError('End date must be after start date', 'INVALID_DATE_RANGE', 400);
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(address && { address }),
        ...(developerId && { developerId }),
        ...(coordinatorId && { coordinatorId }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(budget !== undefined && { budget }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        developer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        coordinator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    logger.info('Project updated successfully', {
      projectId,
      changes: Object.keys(input).filter(key => input[key as keyof UpdateProjectInput] !== undefined)
    });

    const responseData = ApiResponse.success(updatedProject);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Update project handler error', error as Error, { projectId, input });
    throw error;
  }
}