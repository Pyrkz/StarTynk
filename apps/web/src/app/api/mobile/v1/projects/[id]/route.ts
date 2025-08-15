import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { authenticateRequest } from '@repo/auth';
import { ApiResponse } from '@repo/api/responses';
import { Logger } from '@repo/utils/logger';

const logger = new Logger('MobileProjectDetail');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        ApiResponse.error('Unauthorized', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }
    
    const projectId = params.id;
    
    // Fetch project with access control
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { createdById: auth.user.id },
          { coordinatorId: auth.user.id },
          { projectAssignments: { some: { userId: auth.user.id } } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        status: true,
        description: true,
        startDate: true,
        endDate: true,
        updatedAt: true,
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        developer: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: { where: { isActive: true } },
            apartments: { where: { isActive: true } },
          },
        },
      },
    });
    
    if (!project) {
      return NextResponse.json(
        ApiResponse.error('Project not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }
    
    // Get task statistics
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId,
        isActive: true,
      },
      _count: true,
    });
    
    const taskStatusCounts = taskStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>);
    
    const mobileProject = {
      id: project.id,
      name: project.name,
      address: project.address,
      status: project.status,
      description: project.description,
      startDate: project.startDate.toISOString(),
      endDate: project.endDate.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      coordinator: project.coordinator,
      developer: project.developer,
      statistics: {
        totalTasks: project._count.tasks,
        totalApartments: project._count.apartments,
        tasksByStatus: taskStatusCounts,
      },
    };
    
    logger.debug(`Mobile project detail fetched: ${projectId} for user: ${auth.user.id}`);
    
    return NextResponse.json(
      ApiResponse.success(mobileProject),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error fetching mobile project detail:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to fetch project', 'FETCH_ERROR'),
      { status: 500 }
    );
  }
}