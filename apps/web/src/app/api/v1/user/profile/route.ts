import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@repo/auth/middleware/auth.middleware';
import { prisma } from '@repo/database';

/**
 * Protected user profile endpoint that works for both web and mobile
 * GET /api/v1/user/profile
 */
export const GET = withAuth(async (request: NextRequest, { user, clientType }) => {
  try {
    // Get full user data
    const fullUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        department: true,
        position: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        loginCount: true,
        // Include different data based on client type
        ...(clientType === 'web' ? {
          invitedBy: true,
          employmentStartDate: true,
          employmentEndDate: true,
        } : {}),
      }
    });

    if (!fullUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: fullUser,
      clientType,
      authContext: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        deviceId: user.deviceId // Will be present for mobile clients
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch profile' 
      },
      { status: 500 }
    );
  }
});

/**
 * Update user profile endpoint
 * PATCH /api/v1/user/profile
 */
export const PATCH = withAuth(async (request: NextRequest, { user, clientType }) => {
  try {
    const body = await request.json();
    
    // Only allow updating certain fields
    const allowedFields = ['name', 'phone', 'department', 'position'];
    const updateData: any = {};
    
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No valid fields to update' 
        },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        department: true,
        position: true,
      }
    });

    // Log the update
    await prisma.userActivityLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE_PROFILE',
        details: JSON.stringify({ 
          fields: Object.keys(updateData),
          clientType 
        })
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update profile' 
      },
      { status: 500 }
    );
  }
});