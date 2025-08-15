import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { UserFilters, UsersListResponse, UserWithRelations } from '@/features/users/types'
import { Prisma } from '@prisma/client'
import { authenticateToken } from '@/lib/auth/middleware'
import { ApiResponse } from '@/lib/api/response'

// GET /api/users - List users with filters
export async function GET(request: NextRequest) {
  try {
    // Try JWT authentication first (for mobile), then fall back to session auth (for web)
    let isAuthenticated = false
    let authUserId: string | null = null
    
    // Check for Bearer token
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const authResult = await authenticateToken(request)
      if (authResult.user) {
        isAuthenticated = true
        authUserId = authResult.user.id
      }
    }
    
    // Fall back to session auth
    if (!isAuthenticated) {
      const session = await getServerSession()
      if (session?.user) {
        isAuthenticated = true
        authUserId = session.user.id
      }
    }
    
    if (!isAuthenticated) {
      return ApiResponse.unauthorized()
    }

    const searchParams = request.nextUrl.searchParams
    const filters: UserFilters = {
      search: searchParams.get('search') || undefined,
      role: (searchParams.get('role') as UserFilters['role']) || 'ALL',
      isActive: searchParams.get('isActive') === 'true' ? true : 
                searchParams.get('isActive') === 'false' ? false : 'ALL',
      department: searchParams.get('department') || undefined,
      hasLogin: searchParams.get('hasLogin') === 'true' ? true : undefined,
      sortBy: (searchParams.get('sortBy') as UserFilters['sortBy']) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as UserFilters['sortOrder']) || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    }

    // Build where clause
    const where: any = {
      deletedAt: null,
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
        { position: { contains: filters.search } },
      ]
    }

    if (filters.role !== 'ALL') {
      where.role = filters.role
    }

    if (filters.isActive !== 'ALL') {
      where.isActive = filters.isActive
    }

    if (filters.department) {
      where.department = filters.department
    }

    if (filters.hasLogin) {
      where.lastLoginAt = { not: null }
    }

    // Count total records
    const total = await prisma.user.count({ where })

    // Fetch users with pagination
    const users = await prisma.user.findMany({
      where,
      include: {
        inviterUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            taskAssignments: true,
            invitationsSent: true,
            activityLogs: true,
          },
        },
      },
      orderBy: {
        [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
      },
      skip: ((filters.page || 1) - 1) * (filters.pageSize || 20),
      take: filters.pageSize || 20,
    })

    const response: UsersListResponse = {
      users: users as UserWithRelations[],
      total,
      page: filters.page || 1,
      pageSize: filters.pageSize || 20,
      totalPages: Math.ceil(total / (filters.pageSize || 20)),
    }

    // Return response in standardized format for mobile API
    if (authHeader?.startsWith('Bearer ')) {
      return ApiResponse.paginated(
        users as UserWithRelations[],
        filters.page || 1,
        filters.pageSize || 20,
        total
      )
    }
    
    // Return original format for web app
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching users:', error)
    // Return standardized error for mobile API
    if (request.headers.get('authorization')?.startsWith('Bearer ')) {
      return ApiResponse.internalError('Failed to fetch users')
    }
    // Return original error format for web app
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user (direct creation, not invitation)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, role, phone, position, department, employmentStartDate } = body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        phone,
        position,
        department,
        employmentStartDate: employmentStartDate ? new Date(employmentStartDate) : undefined,
        invitedBy: session.user.id,
      },
      include: {
        inviterUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'user_created',
        details: JSON.stringify({
          createdBy: session.user.id,
          role: user.role,
        }),
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}