import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@repo/database';
import { authenticateRequest } from '@repo/auth';
import { ApiResponse } from '@repo/api/responses';
import { MobileTaskDTO } from '@repo/shared/types/dto/mobile';
import { Logger } from '@repo/utils/logger';

const logger = new Logger('MobileProjectTasks');

const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default('10'),
  status: z.string().optional(),
});

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
    
    // Verify project access
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { createdById: auth.user.id },
          { coordinatorId: auth.user.id },
          { projectAssignments: { some: { userId: auth.user.id } } },
        ],
        isActive: true,
      },
      select: { id: true },
    });
    
    if (!hasAccess) {
      return NextResponse.json(
        ApiResponse.error('Project not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, status } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
    });
    
    // Build where clause
    const where: any = {
      projectId,
      isActive: true,
    };
    
    if (status) {
      where.status = status;
    }
    
    // Fetch tasks with minimal data
    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          updatedAt: true,
          assignments: {
            select: {
              userId: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
            take: 1, // Only get the first assignee for mobile
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { updatedAt: 'desc' },
        ],
      }),
      prisma.task.count({ where }),
    ]);
    
    // Map to mobile DTOs
    const mobileDTOs: MobileTaskDTO[] = tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString(),
      assigneeId: t.assignments[0]?.userId,
      assigneeName: t.assignments[0]?.user.name,
    }));
    
    logger.debug(`Mobile tasks fetched for project: ${projectId}`, {
      count: mobileDTOs.length,
      total,
      page,
      status,
    });
    
    return NextResponse.json(
      ApiResponse.paginated(
        mobileDTOs,
        page,
        limit,
        total
      ),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Mobile tasks validation error:', error.errors);
      return NextResponse.json(
        ApiResponse.error('Invalid request parameters', 'VALIDATION_ERROR', error.errors),
        { status: 400 }
      );
    }
    
    logger.error('Error fetching mobile tasks:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to fetch tasks', 'FETCH_ERROR'),
      { status: 500 }
    );
  }
}