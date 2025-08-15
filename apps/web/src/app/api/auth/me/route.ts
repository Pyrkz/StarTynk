import { NextRequest } from 'next/server';
import { prisma } from '@repo/database';
import { ApiResponse } from '@/lib/api/response';
import { protectedRoute } from '@/lib/api/protected-route';
import { sanitizeUser } from '@/lib/api/validators';

export const GET = protectedRoute(async (request: NextRequest, context, authUser) => {
  // Fetch full user data from database
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      image: true,
      department: true,
      position: true,
      employmentStartDate: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      loginCount: true,
      // Include related counts for user dashboard
      _count: {
        select: {
          coordinatedProjects: true,
          taskAssignments: true,
          vehicleAssignments: true,
          equipmentAssignments: true,
        }
      }
    }
  });

  if (!user) {
    return ApiResponse.notFound('User');
  }

  // Return user data with counts
  return ApiResponse.success({
    ...sanitizeUser(user),
    stats: {
      projectsCoordinated: user._count.coordinatedProjects,
      tasksAssigned: user._count.taskAssignments,
      vehiclesAssigned: user._count.vehicleAssignments,
      equipmentAssigned: user._count.equipmentAssignments,
    }
  });
});