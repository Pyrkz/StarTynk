import { prisma } from '@repo/database';
import { ApiResponse } from '../../responses';
import { ApiError, ProjectNotFoundError } from '../../errors';
import type { DeleteProjectInput } from '../../validators';
import { logger } from '../../middleware';

export async function deleteProjectHandler(input: DeleteProjectInput): Promise<Response> {
  try {
    const { id } = input;

    // Check if project exists and get its status
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projectAssignments: true,
            tasks: true,
            materialOrders: true,
            deliveries: true
          }
        }
      }
    });

    if (!existingProject) {
      throw new ProjectNotFoundError(id);
    }

    // Prevent deletion of projects with dependencies
    const hasEmployees = existingProject._count.projectAssignments > 0;
    const hasTasks = existingProject._count.tasks > 0;
    const hasMaterials = existingProject._count.materialOrders > 0;
    const hasDeliveries = existingProject._count.deliveries > 0;

    if (hasEmployees || hasTasks || hasMaterials || hasDeliveries) {
      throw new ApiError(
        'Cannot delete project with existing employees, tasks, materials, or deliveries. Please remove all dependencies first.',
        'PROJECT_HAS_DEPENDENCIES',
        409,
        {
          employees: existingProject._count.projectAssignments,
          tasks: existingProject._count.tasks,
          materials: existingProject._count.materialOrders,
          deliveries: existingProject._count.deliveries
        }
      );
    }

    // Only allow deletion of projects in certain statuses
    if (!['PLANNING', 'CANCELLED'].includes(existingProject.status)) {
      throw new ApiError(
        'Only projects in PLANNING or CANCELLED status can be deleted',
        'INVALID_PROJECT_STATUS_FOR_DELETION',
        409,
        { currentStatus: existingProject.status }
      );
    }

    // Soft delete by updating status and marking as deleted
    const deletedProject = await prisma.project.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        deletedAt: new Date(),
        name: `[DELETED] ${existingProject.name}`
      },
      select: {
        id: true,
        name: true,
        status: true,
        deletedAt: true
      }
    });

    logger.info('Project soft deleted successfully', {
      projectId: id,
      title: existingProject.name,
      previousStatus: existingProject.status
    });

    const responseData = ApiResponse.success({
      message: 'Project deleted successfully',
      project: deletedProject
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Delete project handler error', error as Error, { projectId: input.id });
    throw error;
  }
}