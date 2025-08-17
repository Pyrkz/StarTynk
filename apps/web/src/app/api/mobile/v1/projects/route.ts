import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@repo/database';
import { authenticateRequest } from '@repo/auth';
import { ApiResponse } from '@repo/api/web';
import { MobileProjectDTO } from '@repo/shared/types/dto/mobile';
import { Logger } from '@repo/utils';

const logger = new Logger('MobileProjects');

const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default('10'),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        ApiResponse.error('Unauthorized', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }
    
    // Parse pagination
    const searchParams = request.nextUrl.searchParams;
    const pagination = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });
    
    // Fetch projects with minimal data
    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where: {
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
          status: true,
          updatedAt: true,
          _count: {
            select: { 
              tasks: {
                where: { isActive: true }
              }
            },
          },
          tasks: {
            where: { 
              isActive: true,
              status: { in: ['APPROVED', 'PAID'] }
            },
            select: {
              area: true,
              rate: true,
            },
          },
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.project.count({
        where: {
          OR: [
            { createdById: auth.user.id },
            { coordinatorId: auth.user.id },
            { projectAssignments: { some: { userId: auth.user.id } } },
          ],
          isActive: true,
        },
      }),
    ]);
    
    // Map to mobile DTOs with progress calculation
    const mobileDTOs: MobileProjectDTO[] = projects.map(p => {
      // Calculate progress based on completed tasks
      const totalTasks = p._count.tasks;
      const completedTasks = p.tasks.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        progress,
        taskCount: totalTasks,
        updatedAt: p.updatedAt.toISOString(),
      };
    });
    
    logger.debug(`Mobile projects fetched for user: ${auth.user.id}`, {
      count: mobileDTOs.length,
      total,
      page: pagination.page,
    });
    
    return NextResponse.json(
      ApiResponse.paginated(
        mobileDTOs,
        pagination.page,
        pagination.limit,
        total
      ),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Mobile projects validation error:', error.errors);
      return NextResponse.json(
        ApiResponse.error('Invalid request parameters', 'VALIDATION_ERROR', error.errors),
        { status: 400 }
      );
    }
    
    logger.error('Error fetching mobile projects:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to fetch projects', 'FETCH_ERROR'),
      { status: 500 }
    );
  }
}