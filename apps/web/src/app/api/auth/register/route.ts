import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/lib/api/response';
import { publicRoute } from '@/lib/api/protected-route';
import { validateRequestBody, sanitizeUser, passwordSchema, emailSchema, phoneSchema } from '@/lib/api/validators';
import { createUser } from '@/lib/auth/providers';
import { generateTokenPair } from '@/lib/auth/jwt';
import { Role, RegisterDTO } from '@shared/types';
import { createUserActivityLog } from '@/features/auth/utils/activity-logger';

// Validation schema for registration
const registerSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  name: z.string().min(2).max(100),
  role: z.nativeEnum(Role).optional().default(Role.DEVELOPER),
  invitationCode: z.string().optional(),
});

export const POST = publicRoute(async (request: NextRequest) => {
  // Validate request body
  const body = await validateRequestBody(request, registerSchema);
  
  // Check if invitation code is provided and valid
  let invitation = null;
  if (body.invitationCode) {
    invitation = await prisma.invitationCode.findUnique({
      where: { code: body.invitationCode }
    });

    if (!invitation) {
      return ApiResponse.badRequest('Invalid invitation code');
    }

    if (invitation.usedAt) {
      return ApiResponse.badRequest('Invitation code has already been used');
    }

    if (invitation.expiresAt < new Date()) {
      return ApiResponse.badRequest('Invitation code has expired');
    }

    // Check if email matches invitation
    if (invitation.email.toLowerCase() !== body.email.toLowerCase()) {
      return ApiResponse.badRequest('Email does not match invitation');
    }

    // Use role from invitation if not specified
    if (!body.role) {
      body.role = invitation.role as Role;
    }
  }

  try {
    // Create user
    const user = await createUser({
      email: body.email,
      password: body.password,
      name: body.name,
      phone: body.phone,
      role: body.role,
    });

    // Mark invitation as used if provided
    if (invitation) {
      await prisma.invitationCode.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() }
      });

      // Update user with inviter information
      await prisma.user.update({
        where: { id: user.id },
        data: { invitedBy: invitation.invitedBy }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user.id,
      user.email,
      user.role as Role
    );

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Log registration
    await createUserActivityLog({
      userId: user.id,
      action: 'REGISTRATION',
      details: { 
        method: 'mobile',
        withInvitation: !!invitation 
      }
    });

    // Return user data with tokens
    return ApiResponse.created({
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return ApiResponse.conflict(error.message);
    }
    throw error;
  }
});