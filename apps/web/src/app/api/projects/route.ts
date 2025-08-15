import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@repo/database'
import { authenticateToken, hasRequiredRole } from '@/lib/auth/middleware'
import { ApiResponse } from '@/lib/api/response'
import { parseQueryParams, listQuerySchema, sanitizeUser } from '@/lib/api/validators'
import { z } from 'zod'
import { Role, ProjectStatus } from '@shared/types'
import { Prisma } from '@repo/database'

// Helper to check authentication
async function checkAuth(request: NextRequest) {
  // Try JWT authentication first (for mobile)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const authResult = await authenticateToken(request)
    if (authResult.user) {
      return { 
        isAuthenticated: true, 
        user: authResult.user,
        isMobile: true 
      }
    }
  }
  
  // Fall back to session auth (for web)
  const session = await getServerSession()
  if (session?.user) {
    return { 
      isAuthenticated: true, 
      user: {
        id: session.user.id,
        email: session.user.email!,
        role: session.user.role as Role,
        isActive: true
      },
      isMobile: false 
    }
  }
  
  return { isAuthenticated: false, user: null, isMobile: false }
}

// GET /api/projects - List projects with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth(request)
    if (!auth.isAuthenticated) {
      return auth.isMobile 
        ? ApiResponse.unauthorized()
        : NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const searchParams = request.nextUrl.searchParams
    const { page, pageSize, sortBy, sortOrder, search } = parseQueryParams(
      searchParams,
      listQuerySchema
    )

    // Build where clause
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { developer: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    }

    // Add status filter if provided
    const status = searchParams.get('status')
    if (status && Object.values(ProjectStatus).includes(status as ProjectStatus)) {
      where.status = status
    }

    // Add coordinator filter for non-admin users
    if (!hasRequiredRole(auth.user!.role, [Role.ADMIN, Role.MODERATOR])) {
      if (auth.user!.role === Role.COORDINATOR) {
        where.coordinatorId = auth.user!.id
      } else {
        // Regular users can only see active projects
        where.status = { in: ['PLANNING', 'IN_PROGRESS', 'REVIEW'] }
      }
    }

    // Count total projects
    const total = await prisma.project.count({ where })

    // Fetch projects with pagination
    const projects = await prisma.project.findMany({
      where,
      include: {
        developer: {
          select: {
            id: true,
            name: true,
          },
        },
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            apartments: true,
            buildings: true,
            tasks: true,
            qualityControls: true,
          }
        }
      },
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // Transform projects for response
    const transformedProjects = projects.map(project => ({
      ...project,
      coordinator: project.coordinator ? sanitizeUser(project.coordinator) : null,
      creator: project.creator ? sanitizeUser(project.creator) : null,
      stats: {
        apartmentsCount: project._count.apartments,
        buildingsCount: project._count.buildings,
        tasksCount: project._count.tasks,
        qualityControlsCount: project._count.qualityControls,
      }
    }))

    // Return response in standardized format for mobile API
    if (auth.isMobile) {
      return ApiResponse.paginated(transformedProjects, page, pageSize, total)
    }
    
    // Return original format for web app
    return NextResponse.json({
      projects: transformedProjects,
      pagination: {
        page,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })

  } catch (error) {
    console.error('Error fetching projects:', error)
    if (request.headers.get('authorization')?.startsWith('Bearer ')) {
      return ApiResponse.internalError('Failed to fetch projects')
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth(request)
    if (!auth.isAuthenticated) {
      return auth.isMobile 
        ? ApiResponse.unauthorized()
        : NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins, moderators, and coordinators can create projects
    if (!hasRequiredRole(auth.user!.role, [Role.ADMIN, Role.MODERATOR, Role.COORDINATOR])) {
      return auth.isMobile
        ? ApiResponse.forbidden('Insufficient permissions')
        : NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    const createProjectSchema = z.object({
      name: z.string().min(3).max(200),
      description: z.string().optional(),
      address: z.string().min(5),
      developerId: z.string(),
      coordinatorId: z.string().optional(),
      status: z.nativeEnum(ProjectStatus).optional().default(ProjectStatus.PLANNING),
      plannedStartDate: z.string().datetime().optional(),
      plannedEndDate: z.string().datetime().optional(),
      actualStartDate: z.string().datetime().optional(),
      actualEndDate: z.string().datetime().optional(),
      totalArea: z.number().positive().optional(),
      totalBudget: z.number().positive().optional(),
    }).refine(data => {
      // If planned dates are provided, end date must be after start date
      if (data.plannedStartDate && data.plannedEndDate) {
        return new Date(data.plannedEndDate) > new Date(data.plannedStartDate)
      }
      return true
    }, {
      message: 'Planned end date must be after planned start date',
    })

    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    // Check if developer exists
    const developer = await prisma.developer.findUnique({
      where: { id: validatedData.developerId }
    })

    if (!developer) {
      return auth.isMobile
        ? ApiResponse.notFound('Developer')
        : NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    // If coordinator is specified, check if they exist and have the right role
    if (validatedData.coordinatorId) {
      const coordinator = await prisma.user.findUnique({
        where: { id: validatedData.coordinatorId },
        select: { role: true }
      })

      if (!coordinator) {
        return auth.isMobile
          ? ApiResponse.notFound('Coordinator')
          : NextResponse.json({ error: 'Coordinator not found' }, { status: 404 })
      }

      if (!hasRequiredRole(coordinator.role as Role, [Role.COORDINATOR, Role.ADMIN, Role.MODERATOR])) {
        return auth.isMobile
          ? ApiResponse.badRequest('Selected user is not a coordinator')
          : NextResponse.json({ error: 'Selected user is not a coordinator' }, { status: 400 })
      }
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        ...validatedData,
        coordinatorId: validatedData.coordinatorId || (auth.user!.role === Role.COORDINATOR ? auth.user!.id : undefined),
        creatorId: auth.user!.id,
        plannedStartDate: validatedData.plannedStartDate ? new Date(validatedData.plannedStartDate) : undefined,
        plannedEndDate: validatedData.plannedEndDate ? new Date(validatedData.plannedEndDate) : undefined,
        actualStartDate: validatedData.actualStartDate ? new Date(validatedData.actualStartDate) : undefined,
        actualEndDate: validatedData.actualEndDate ? new Date(validatedData.actualEndDate) : undefined,
      },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
          },
        },
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      }
    })

    // Log project creation
    const { createUserActivityLog } = await import('@/features/auth/utils/activity-logger')
    await createUserActivityLog({
      userId: auth.user!.id,
      action: 'PROJECT_CREATED',
      details: { 
        projectId: project.id,
        projectName: project.name,
      }
    })

    // Transform response
    const transformedProject = {
      ...project,
      coordinator: project.coordinator ? sanitizeUser(project.coordinator) : null,
      creator: project.creator ? sanitizeUser(project.creator) : null,
    }

    if (auth.isMobile) {
      return ApiResponse.created(transformedProject, `/api/projects/${project.id}`)
    }

    return NextResponse.json(transformedProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    if (error instanceof z.ZodError) {
      return request.headers.get('authorization')?.startsWith('Bearer ')
        ? ApiResponse.validationError(error.errors)
        : NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return request.headers.get('authorization')?.startsWith('Bearer ')
      ? ApiResponse.internalError('Failed to create project')
      : NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}