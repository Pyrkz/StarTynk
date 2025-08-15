import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@repo/database';
import { ApiResponse } from '@/lib/api/response';
import { authenticateToken } from '@/lib/auth/middleware';
import { sanitizeUser } from '@/lib/api/validators';
import { z } from 'zod';

// Helper to check authentication
async function checkAuth(request: NextRequest) {
  // Try JWT authentication first (for mobile)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const authResult = await authenticateToken(request);
    if (authResult.user) {
      return { 
        isAuthenticated: true, 
        user: authResult.user,
        isMobile: true 
      };
    }
  }
  
  // Fall back to session auth (for web)
  const session = await getServerSession();
  if (session?.user) {
    return { 
      isAuthenticated: true, 
      user: session.user,
      isMobile: false 
    };
  }
  
  return { isAuthenticated: false, user: null, isMobile: false };
}

// GET /api/users/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return ApiResponse.unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
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
            coordinatedProjects: true,
            taskAssignments: true,
            vehicleAssignments: true,
            equipmentAssignments: true,
            invitationsSent: true,
          },
        },
      },
    });

    if (!user) {
      return ApiResponse.notFound('User profile');
    }

    const profile = {
      ...sanitizeUser(user),
      invitedBy: user.inviterUser ? sanitizeUser(user.inviterUser) : null,
      stats: {
        projectsCoordinated: user._count.coordinatedProjects,
        tasksAssigned: user._count.taskAssignments,
        vehiclesAssigned: user._count.vehicleAssignments,
        equipmentAssigned: user._count.equipmentAssignments,
        invitationsSent: user._count.invitationsSent,
      }
    };

    return ApiResponse.success(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return ApiResponse.internalError('Failed to fetch profile');
  }
}

// PUT /api/users/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return ApiResponse.unauthorized();
    }

    // Parse request body
    const body = await request.json();

    // Users can only update their own basic info
    const updateSchema = z.object({
      name: z.string().min(2).max(100).optional(),
      phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Invalid phone number').optional(),
      image: z.string().url().optional().nullable(),
      // Password update requires current password
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8).optional(),
    }).refine(data => {
      // If updating password, both fields are required
      if (data.newPassword || data.currentPassword) {
        return data.newPassword && data.currentPassword;
      }
      return true;
    }, {
      message: 'Both current and new password are required to change password',
    });

    const validatedData = updateSchema.parse(body);

    // If updating password, verify current password
    if (validatedData.currentPassword && validatedData.newPassword) {
      const { validateUserCredentials } = await import('@/lib/auth/providers');
      const isValid = await validateUserCredentials({
        email: auth.user.email,
        password: validatedData.currentPassword,
      });

      if (!isValid) {
        return ApiResponse.badRequest('Current password is incorrect');
      }

      // Hash new password
      const bcrypt = await import('bcryptjs');
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { password: hashedPassword },
      });

      // Delete all refresh tokens to force re-login
      await prisma.refreshToken.deleteMany({
        where: { userId: auth.user.id },
      });
    }

    // Update profile (excluding password fields)
    const { currentPassword, newPassword, ...profileData } = validatedData;
    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: profileData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        image: true,
        updatedAt: true,
      },
    });

    // Log profile update
    const { createUserActivityLog } = await import('@/features/auth/utils/activity-logger');
    await createUserActivityLog({
      userId: auth.user.id,
      action: 'PROFILE_UPDATED',
      details: { 
        updatedFields: Object.keys(profileData),
        passwordChanged: !!validatedData.newPassword,
      }
    });

    return ApiResponse.success({
      ...sanitizeUser(updatedUser),
      passwordChanged: !!validatedData.newPassword,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error instanceof z.ZodError) {
      return ApiResponse.validationError(error.errors);
    }
    return ApiResponse.internalError('Failed to update profile');
  }
}