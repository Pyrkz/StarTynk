import { prisma } from '@repo/database';
import { ApiResponse } from '../../responses';
import { ProjectNotFoundError } from '../../errors';
import { GetProjectInput } from '../../validators';
import { logger } from '../../middleware';

export async function getProjectHandler(input: GetProjectInput): Promise<Response> {
  try {
    const { id } = input;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        developer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        coordinator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        employees: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            },
            role: true,
            hourlyRate: true,
            joinedAt: true
          },
          orderBy: { joinedAt: 'desc' }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        materials: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            unitPrice: true,
            totalPrice: true,
            status: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            employees: true,
            tasks: true,
            materials: true,
            deliveries: true
          }
        }
      }
    });

    if (!project) {
      throw new ProjectNotFoundError(id);
    }

    logger.info('Project retrieved', { projectId: id });

    const responseData = ApiResponse.success(project);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Get project handler error', error as Error, { projectId: input.id });
    throw error;
  }
}