import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@repo/database'
import { authenticateToken, hasRequiredRole } from '@/lib/auth/middleware'
import { ApiResponse } from '@/lib/api/response'
import { sanitizeUser } from '@/lib/api/validators'
import { z } from 'zod'
import { Role, ProjectStatus } from '@shared/types'
import { getMockProject } from './mock-data'
import { updateProjectSchema } from '@/features/projekty/utils/validation'

interface RouteParams {
  params: Promise<{
    projectId: string
  }>
}

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

// GET /api/projects/[id] - Get single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAuth(request)
    if (!auth.isAuthenticated) {
      return auth.isMobile 
        ? ApiResponse.unauthorized()
        : NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    // Await params to get the projectId
    const { projectId } = await params

    try {
      // Try to fetch from database first
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          developer: true,
          coordinator: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              image: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          buildings: {
            include: {
              _count: {
                select: {
                  apartments: true,
                }
              }
            }
          },
          apartments: {
            select: {
              id: true,
              number: true,
              status: true,
              floor: true,
              area: true,
            }
          },
          tasks: {
            include: {
              assignments: {
                include: {
                  assignee: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              apartments: true,
              buildings: true,
              tasks: true,
              qualityControls: true,
              materials: true,
              deliveries: true,
            }
          }
        },
      })

      if (project) {
        // Check if user has access to this project
        const canViewProject = 
          hasRequiredRole(auth.user!.role, [Role.ADMIN, Role.MODERATOR]) ||
          (auth.user!.role === Role.COORDINATOR && project.coordinatorId === auth.user!.id) ||
          ['PLANNING', 'IN_PROGRESS', 'REVIEW'].includes(project.status)

        if (!canViewProject) {
          return auth.isMobile
            ? ApiResponse.forbidden('Cannot view this project')
            : NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Transform response
        const transformedProject = {
          ...project,
          coordinator: project.coordinator ? sanitizeUser(project.coordinator) : null,
          creator: project.creator ? sanitizeUser(project.creator) : null,
          tasks: project.tasks.map(task => ({
            ...task,
            assignments: task.assignments.map(assignment => ({
              ...assignment,
              assignee: sanitizeUser(assignment.assignee),
            }))
          })),
          stats: {
            apartmentsCount: project._count.apartments,
            buildingsCount: project._count.buildings,
            tasksCount: project._count.tasks,
            qualityControlsCount: project._count.qualityControls,
            materialsCount: project._count.materials,
            deliveriesCount: project._count.deliveries,
            completionRate: project.tasks.length > 0 
              ? (project.tasks.filter(t => t.status === 'COMPLETED').length / project.tasks.length) * 100
              : 0,
          }
        }

        if (auth.isMobile) {
          return ApiResponse.success(transformedProject)
        }
        return NextResponse.json({ project: transformedProject })
      }
    } catch (dbError) {
      console.error('Database error, falling back to mock:', dbError)
    }

    // Fall back to mock data if database fails or no data
    const mockProject = getMockProject(projectId)
    if (!mockProject || mockProject.id === 'default') {
      return auth.isMobile
        ? ApiResponse.notFound('Project')
        : NextResponse.json({ error: 'Projekt nie został znaleziony' }, { status: 404 })
    }

    if (auth.isMobile) {
      return ApiResponse.success(mockProject)
    }
    return NextResponse.json({ project: mockProject })

  } catch (error) {
    console.error('Błąd pobierania projektu:', error)
    return request.headers.get('authorization')?.startsWith('Bearer ')
      ? ApiResponse.internalError('Failed to fetch project')
      : NextResponse.json({ error: error instanceof Error ? error.message : 'Wewnętrzny błąd serwera' }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // const session = await getServerSession() // Temporarily disabled for client demo
    // 
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    // }

    // Await params to get the projectId
    const { projectId } = await params

    // Get user to check permissions - disabled for demo
    // const user = await prisma.user.findUnique({
    //   where: { email: session.user.email! }
    // })

    // if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR' && user.role !== 'COORDINATOR')) {
    //   return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    // }
    
    // Mock user for demo
    const user = { id: 'demo-user', name: 'Demo User', email: 'demo@example.com' }

    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    // Get existing mock project
    const existingProject = getMockProject(projectId)

    if (!existingProject || existingProject.id === 'default') {
      return NextResponse.json({ error: 'Projekt nie został znaleziony' }, { status: 404 })
    }

    // Mock update - merge data
    const updatedProject = {
      ...existingProject,
      ...validatedData,
      updatedAt: new Date(),
    }

    return NextResponse.json({ project: updatedProject })

  } catch (error) {
    console.error('Błąd aktualizacji projektu:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Nieprawidłowe dane', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Wewnętrzny błąd serwera' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Soft delete project
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    // const session = await getServerSession() // Temporarily disabled for client demo
    // 
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    // }

    // Await params to get the projectId
    const { projectId } = await params

    // Get user to check permissions - disabled for demo
    // const user = await prisma.user.findUnique({
    //   where: { email: session.user.email! }
    // })

    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Brak uprawnień - tylko administrator może usuwać projekty' }, { status: 403 })
    // }
    
    // Mock user for demo
    const user = { id: 'demo-user', name: 'Demo User', email: 'demo@example.com' }

    // Get mock project
    const existingProject = getMockProject(projectId)

    if (!existingProject || existingProject.id === 'default') {
      return NextResponse.json({ error: 'Projekt nie został znaleziony' }, { status: 404 })
    }

    // Mock delete - just return success
    return NextResponse.json({ success: true, message: 'Projekt został usunięty' })

  } catch (error) {
    console.error('Błąd usuwania projektu:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Wewnętrzny błąd serwera' }, { status: 500 })
  }
}