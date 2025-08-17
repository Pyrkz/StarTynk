import { prisma } from '@repo/database';
import { ApiResponse } from '../../responses';
import { ApiError, UserNotFoundError } from '../../errors';
import type { CreateProjectInput } from '../../validators';
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

    // Validate roles - check that developer has appropriate permissions to create projects
    const validDeveloperRoles = ['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN'] as const;
    if (!validDeveloperRoles.includes(developer.role as any)) {
      throw new ApiError('Developer must have DEVELOPER, PROJECT_MANAGER, or ADMIN role', 'INVALID_DEVELOPER_ROLE', 400);
    }

    // Validate coordinator role - COORDINATOR and MODERATOR both have project coordination permissions  
    const validCoordinatorRoles = ['COORDINATOR', 'MODERATOR', 'PROJECT_MANAGER', 'ADMIN'] as const;
    if (!validCoordinatorRoles.includes(coordinator.role as any)) {
      throw new ApiError('Coordinator must have COORDINATOR, MODERATOR, PROJECT_MANAGER, or ADMIN role', 'INVALID_COORDINATOR_ROLE', 400);
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
    const projectData: any = {
      name: title, // Use 'name' field instead of 'title'
      description,
      address,
      developerId,
      coordinatorId,
      startDate: new Date(startDate),
      status: status as any, // Cast to match Prisma enum
      baseRate: budget ? Number(budget) : 0, // Required field in schema
      createdById: developerId // Required field in schema
    };

    // Add optional fields only if they have values
    if (endDate) {
      projectData.endDate = new Date(endDate);
    }
    if (budget) {
      projectData.budget = Number(budget);
    }

    const project = await prisma.project.create({
      data: projectData,
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info('Project created successfully', {
      projectId: project.id,
      name: project.name,
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