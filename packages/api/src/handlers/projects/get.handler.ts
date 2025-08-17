import { prisma } from '@repo/database';
import { ApiResponse } from '../../responses';
import { ProjectNotFoundError } from '../../errors';
import type { GetProjectInput } from '../../validators';
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
            name: true,
            email: true,
            phone: true
          }
        },
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        projectAssignments: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            },
            role: true,
            assignedDate: true
          },
          orderBy: { assignedDate: 'desc' }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignments: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        materialOrders: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            orderDate: true,
            items: {
              select: {
                quantity: true,
                unitPrice: true,
                material: {
                  select: {
                    name: true,
                    unit: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
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