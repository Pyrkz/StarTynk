import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@repo/database'
import { UpdateUserDTO } from '@/features/users/types'
import { authenticateToken, hasRequiredRole } from '@/lib/auth/middleware'
import { ApiResponse } from '@/lib/api/response'
import { sanitizeUser } from '@/lib/api/validators'
import { Role } from '@repo/shared/types'

interface RouteParams {
  params: Promise<{
    id: string
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

// GET /api/users/[id] - Get user details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAuth(request)
    if (!auth.isAuthenticated) {
      return auth.isMobile 
        ? ApiResponse.unauthorized()
        : NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params to get the id
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { 
        id,
        deletedAt: null,
      },
      include: {
        inviterUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invitationsSent: {
          include: {
            inviter: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        activityLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
        _count: {
          select: {
            taskAssignments: true,
            invitationsSent: true,
            qualityControls: true,
            materialOrders: true,
            equipmentAssignments: true,
            vehicleAssignments: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params to get the id
    const { id } = await params

    // Only admins can update other users, users can update themselves
    if (session.user.role !== 'ADMIN' && session.user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: UpdateUserDTO = await request.json()
    
    // Get current user data for activity log
    const currentUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: Partial<UpdateUserDTO> = {}
    const changes: Record<string, { from: unknown; to: unknown }> = {}

    // Track changes for activity log
    if (body.name !== undefined && body.name !== currentUser.name) {
      updateData.name = body.name
      changes.name = { from: currentUser.name, to: body.name }
    }

    if (body.email !== undefined && body.email !== currentUser.email) {
      // Check if email is already taken
      const emailTaken = await prisma.user.findUnique({
        where: { email: body.email },
      })
      if (emailTaken && emailTaken.id !== id) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
      updateData.email = body.email
      changes.email = { from: currentUser.email, to: body.email }
    }

    if (body.role !== undefined && body.role !== currentUser.role) {
      // Only admins can change roles
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only admins can change user roles' },
          { status: 403 }
        )
      }
      updateData.role = body.role
      changes.role = { from: currentUser.role, to: body.role }
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone
      changes.phone = { from: currentUser.phone, to: body.phone }
    }

    if (body.position !== undefined) {
      updateData.position = body.position
      changes.position = { from: currentUser.position, to: body.position }
    }

    if (body.department !== undefined) {
      updateData.department = body.department
      changes.department = { from: currentUser.department, to: body.department }
    }

    if (body.isActive !== undefined && body.isActive !== currentUser.isActive) {
      // Only admins can deactivate users
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only admins can change user status' },
          { status: 403 }
        )
      }
      updateData.isActive = body.isActive
      changes.isActive = { from: currentUser.isActive, to: body.isActive }
    }

    if (body.employmentStartDate !== undefined) {
      updateData.employmentStartDate = body.employmentStartDate ? new Date(body.employmentStartDate) : undefined
    }

    if (body.employmentEndDate !== undefined) {
      updateData.employmentEndDate = body.employmentEndDate ? new Date(body.employmentEndDate) : undefined
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    // Log changes
    if (Object.keys(changes).length > 0) {
      await prisma.userActivityLog.create({
        data: {
          userId: id,
          action: 'user_updated',
          details: JSON.stringify({
            changes,
            updatedBy: session.user.id,
          }),
        },
      })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Soft delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params to get the id
    const { id } = await params

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Soft delete user
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    })

    // Log deletion
    await prisma.userActivityLog.create({
      data: {
        userId: id,
        action: 'user_deleted',
        details: JSON.stringify({
          deletedBy: session.user.id,
        }),
      },
    })

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}