import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { UserStatistics } from '@/features/users/types'

// GET /api/users/statistics - Get user statistics
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total and active users count
    const [totalUsers, activeUsers] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, isActive: true } }),
    ])

    // Get users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      where: { deletedAt: null },
      _count: true,
    })

    // Get users by department
    const usersByDepartment = await prisma.user.groupBy({
      by: ['department'],
      where: { 
        deletedAt: null,
        department: { not: null },
      },
      _count: true,
    })

    // Get recently active users (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentlyActive = await prisma.user.count({
      where: {
        deletedAt: null,
        lastLoginAt: { gte: sevenDaysAgo },
      },
    })

    // Get pending invitations
    const pendingInvitations = await prisma.invitationCode.count({
      where: {
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    // Format statistics
    const statistics: UserStatistics = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: usersByRole.reduce((acc: Record<string, number>, item: any) => {
        acc[item.role] = item._count
        return acc
      }, {} as Record<string, number>),
      usersByDepartment: usersByDepartment.reduce((acc: Record<string, number>, item: any) => {
        acc[item.department || 'Unassigned'] = item._count
        return acc
      }, {} as Record<string, number>),
      recentlyActive,
      pendingInvitations,
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching user statistics:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}