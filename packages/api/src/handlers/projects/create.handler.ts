import { prisma } from '@repo/database';
import { ApiResponse } from '../../responses';
import { ApiError, UserNotFoundError } from '../../errors';
import { CreateProjectInput } from '../../validators';
import { logger } from '../../middleware';

export async function createProjectHandler(input: CreateProjectInput): Promise<Response> {
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
      status = 'PLANNING'
    } = input;

    // Validate that developer and coordinator exist
    const [developer, coordinator] = await Promise.all([
      prisma.user.findUnique({
        where: { id: developerId },
        select: { id: true, role: true, isActive: true }
      }),
      prisma.user.findUnique({
        where: { id: coordinatorId },
        select: { id: true, role: true, isActive: true }
      })
    ]);

    if (!developer) {
      throw new UserNotFoundError(developerId);
    }

    if (!coordinator) {
      throw new UserNotFoundError(coordinatorId);
    }

    // Validate roles
    if (developer.role !== 'DEVELOPER' && developer.role !== 'PROJECT_MANAGER' && developer.role !== 'ADMIN') {
      throw new ApiError('Developer must have DEVELOPER, PROJECT_MANAGER, or ADMIN role', 'INVALID_DEVELOPER_ROLE', 400);
    }

    if (coordinator.role !== 'COORDINATOR' && coordinator.role !== 'PROJECT_MANAGER' && coordinator.role !== 'ADMIN') {
      throw new ApiError('Coordinator must have COORDINATOR, PROJECT_MANAGER, or ADMIN role', 'INVALID_COORDINATOR_ROLE', 400);
    }

    // Validate that users are active
    if (!developer.isActive) {
      throw new ApiError('Developer account is inactive', 'INACTIVE_DEVELOPER', 400);
    }

    if (!coordinator.isActive) {
      throw new ApiError('Coordinator account is inactive', 'INACTIVE_COORDINATOR', 400);
    }

    // Validate dates
    if (endDate && new Date(endDate) <= new Date(startDate)) {
      throw new ApiError('End date must be after start date', 'INVALID_DATE_RANGE', 400);
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        title,
        description,
        address,
        developerId,
        coordinatorId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        budget,
        status
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

    logger.info('Project created successfully', {
      projectId: project.id,
      title: project.title,
      developerId,
      coordinatorId,
      status
    });

    const responseData = ApiResponse.created(project);

    return new Response(JSON.stringify(responseData), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Create project handler error', error as Error, {
      title: input.title,
      developerId: input.developerId,
      coordinatorId: input.coordinatorId
    });
    throw error;
  }
}