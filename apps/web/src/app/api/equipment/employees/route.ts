import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/features/auth/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all users with their equipment assignments
    const users = await prisma.user.findMany({
      where: { 
        isActive: true,
        role: { in: ['USER', 'WORKER', 'COORDINATOR', 'MODERATOR'] } // Exclude pure admins
      },
      include: {
        equipmentAssignments: {
          where: { isActive: true },
          include: {
            equipment: {
              include: {
                category: true,
              },
            },
          },
          orderBy: { assignedDate: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate recent returns (assignments returned in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReturns = await prisma.equipmentAssignment.groupBy({
      by: ['userId'],
      where: {
        isActive: false,
        returnDate: {
          gte: thirtyDaysAgo,
        },
      },
      _count: true,
    });

    const recentReturnsMap = new Map(
      recentReturns.map(r => [r.userId, r._count])
    );

    // Transform data into UserEquipmentSummary format
    const employees = users.map(user => {
      const assignedEquipment = user.equipmentAssignments.map(assignment => {
        const today = new Date();
        // For this demo, consider equipment overdue if assigned more than 90 days ago
        const assignedDate = new Date(assignment.assignedDate);
        const daysDifference = Math.floor((today.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysDifference > 90; // Simple overdue logic
        
        // Try to extract expected return date from notes (this is a temporary solution)
        let expectedReturnDate = null;
        if (assignment.notes && assignment.notes.includes('Expected return:')) {
          const match = assignment.notes.match(/Expected return: (\d{4}-\d{2}-\d{2})/);
          if (match) {
            expectedReturnDate = new Date(match[1]);
            // Check if overdue based on expected return date
            if (expectedReturnDate < today) {
              // isOverdue = true; // Could override the simple logic above
            }
          }
        }

        return {
          id: assignment.equipment.id,
          name: assignment.equipment.name,
          category: assignment.equipment.category.name,
          assignedDate: assignment.assignedDate,
          expectedReturnDate,
          isOverdue,
          condition: assignment.equipment.condition || 'unknown',
        };
      });

      const overdueCount = assignedEquipment.filter(eq => eq.isOverdue).length;
      const recentReturnsCount = recentReturnsMap.get(user.id) || 0;

      return {
        userId: user.id,
        userName: user.name || 'Unknown',
        userEmail: user.email,
        position: user.position,
        assignedEquipment,
        totalAssigned: assignedEquipment.length,
        overdueCount,
        recentReturns: recentReturnsCount,
      };
    });

    // Calculate overall stats
    const stats = {
      totalEmployees: employees.length,
      employeesWithEquipment: employees.filter(emp => emp.totalAssigned > 0).length,
      totalAssignedEquipment: employees.reduce((sum, emp) => sum + emp.totalAssigned, 0),
      overdueEquipment: employees.reduce((sum, emp) => sum + emp.overdueCount, 0),
    };

    return NextResponse.json({
      employees,
      stats,
    });
  } catch (error) {
    console.error('Error fetching employee equipment data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}