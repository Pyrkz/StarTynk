import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { 
  authMiddleware, 
  requireAdmin, 
  requireModeratorOrAdmin,
  commonSchemas,
  searchFilterSchema 
} from '../middleware';
import { Role } from '@repo/shared';
import { isAuthenticatedContext } from '../context';

/**
 * User creation schema
 */
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(Role).default(Role.USER),
  department: z.string().optional(),
  position: z.string().optional(),
  employmentStartDate: z.date().optional(),
  employmentEndDate: z.date().optional(),
});

/**
 * User update schema
 */
const updateUserSchema = z.object({
  id: commonSchemas.id,
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  role: z.nativeEnum(Role).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  employmentStartDate: z.date().optional(),
  employmentEndDate: z.date().optional(),
  isActive: z.boolean().optional(),
});

/**
 * User filters schema
 */
const userFiltersSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
  employmentStatus: z.enum(['current', 'former', 'all']).default('current'),
  ...searchFilterSchema.shape,
});

/**
 * Password change schema
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * User router with CRUD operations and user management
 */
export const userRouter = router({
  /**
   * List users with filtering and pagination
   */
  list: protectedProcedure
    .use(authMiddleware)
    .use(requireModeratorOrAdmin)
    .input(userFiltersSchema)
    .query(async ({ input, ctx }) => {
      const { 
        search, 
        role, 
        department, 
        isActive, 
        employmentStatus,
        page, 
        limit, 
        sortBy = 'name', 
        sortOrder 
      } = input;

      try {
        const where: any = {
          deletedAt: null,
        };

        // Apply filters
        if (role) where.role = role;
        if (department) where.department = department;
        if (isActive !== undefined) where.isActive = isActive;

        // Employment status filter
        if (employmentStatus === 'current') {
          where.OR = [
            { employmentEndDate: null },
            { employmentEndDate: { gt: new Date() } }
          ];
        } else if (employmentStatus === 'former') {
          where.employmentEndDate = { lte: new Date() };
        }

        // Search filter
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { department: { contains: search, mode: 'insensitive' } },
            { position: { contains: search, mode: 'insensitive' } },
          ];
        }

        // Count total records
        const total = await ctx.prisma.user.count({ where });

        // Fetch users with pagination
        const users = await ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            department: true,
            position: true,
            isActive: true,
            employmentStartDate: true,
            employmentEndDate: true,
            lastLoginAt: true,
            loginCount: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        });

        return {
          data: users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        };
      } catch (error) {
        console.error('List users error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch users',
        });
      }
    }),

  /**
   * Get user by ID
   */
  getById: protectedProcedure
    .use(authMiddleware)
    .input(z.object({ id: commonSchemas.id }))
    .query(async ({ input, ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const { id } = input;

      // Users can view their own profile, others need admin/moderator role
      if (ctx.userId !== id && ![Role.ADMIN, Role.MODERATOR].includes(ctx.user.role as Role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      try {
        const user = await ctx.prisma.user.findUnique({
          where: { 
            id,
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            department: true,
            position: true,
            isActive: true,
            employmentStartDate: true,
            employmentEndDate: true,
            lastLoginAt: true,
            loginCount: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            // Include related data for detailed view
            createdProjects: {
              select: { id: true, name: true, status: true },
              take: 5,
            },
            taskAssignments: {
              select: { 
                task: { 
                  select: { id: true, title: true, status: true } 
                } 
              },
              take: 5,
            },
          },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        return user;
      } catch (error) {
        console.error('Get user error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user',
        });
      }
    }),

  /**
   * Create new user (Admin only)
   */
  create: protectedProcedure
    .use(authMiddleware)
    .use(requireAdmin)
    .input(createUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { password, ...userData } = input;

      try {
        // Check if user already exists
        const existingUser = await ctx.prisma.user.findFirst({
          where: {
            OR: [
              { email: userData.email },
              userData.phone ? { phone: userData.phone } : {},
            ].filter(condition => Object.keys(condition).length > 0),
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User with this email or phone already exists',
          });
        }

        // Hash password
        const { PasswordUtils } = await import('@repo/auth');
        const hashedPassword = await PasswordUtils.hash(password);

        // Create user
        const user = await ctx.prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            department: true,
            position: true,
            isActive: true,
            createdAt: true,
          },
        });

        return user;
      } catch (error) {
        console.error('Create user error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        });
      }
    }),

  /**
   * Update user
   */
  update: protectedProcedure
    .use(authMiddleware)
    .input(updateUserSchema)
    .mutation(async ({ input, ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const { id, ...updateData } = input;

      // Users can update their own basic info, admins can update anyone
      const isOwnProfile = ctx.userId === id;
      const isAdmin = ctx.user.role === Role.ADMIN;

      if (!isOwnProfile && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      // Restrict what non-admins can update
      if (isOwnProfile && !isAdmin) {
        const allowedFields = ['name', 'phone'];
        const restrictedFields = Object.keys(updateData).filter(
          key => !allowedFields.includes(key)
        );
        
        if (restrictedFields.length > 0) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Cannot update fields: ${restrictedFields.join(', ')}`,
          });
        }
      }

      try {
        // Check if user exists
        const existingUser = await ctx.prisma.user.findUnique({
          where: { id, deletedAt: null },
        });

        if (!existingUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Check for email/phone conflicts if updating
        if (updateData.email || updateData.phone) {
          const conflictWhere = {
            AND: [
              { id: { not: id } },
              {
                OR: [
                  updateData.email ? { email: updateData.email } : {},
                  updateData.phone ? { phone: updateData.phone } : {},
                ].filter(condition => Object.keys(condition).length > 0),
              },
            ],
          };

          const conflictUser = await ctx.prisma.user.findFirst({
            where: conflictWhere,
          });

          if (conflictUser) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Email or phone already in use by another user',
            });
          }
        }

        // Update user
        const updatedUser = await ctx.prisma.user.update({
          where: { id },
          data: {
            ...updateData,
            updatedAt: new Date(),
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            department: true,
            position: true,
            isActive: true,
            updatedAt: true,
          },
        });

        return updatedUser;
      } catch (error) {
        console.error('Update user error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user',
        });
      }
    }),

  /**
   * Delete user (soft delete - Admin only)
   */
  delete: protectedProcedure
    .use(authMiddleware)
    .use(requireAdmin)
    .input(z.object({ id: commonSchemas.id }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      try {
        // Check if user exists
        const user = await ctx.prisma.user.findUnique({
          where: { id, deletedAt: null },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Soft delete user
        await ctx.prisma.user.update({
          where: { id },
          data: {
            isActive: false,
            deletedAt: new Date(),
          },
        });

        return { success: true, message: 'User deleted successfully' };
      } catch (error) {
        console.error('Delete user error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete user',
        });
      }
    }),

  /**
   * Change user password
   */
  changePassword: protectedProcedure
    .use(authMiddleware)
    .input(changePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const { currentPassword, newPassword } = input;

      try {
        // Get current user with password
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.userId },
          select: { id: true, password: true },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Verify current password
        const { PasswordUtils } = await import('@repo/auth');
        const isCurrentPasswordValid = await PasswordUtils.verify(
          currentPassword, 
          user.password || ''
        );

        if (!isCurrentPasswordValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
          });
        }

        // Hash new password
        const hashedNewPassword = await PasswordUtils.hash(newPassword);

        // Update password
        await ctx.prisma.user.update({
          where: { id: ctx.userId },
          data: { password: hashedNewPassword },
        });

        // Invalidate all refresh tokens to force re-login
        await ctx.prisma.refreshToken.deleteMany({
          where: { userId: ctx.userId },
        });

        return { success: true, message: 'Password changed successfully' };
      } catch (error) {
        console.error('Change password error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change password',
        });
      }
    }),

  /**
   * Get user statistics
   */
  getStats: protectedProcedure
    .use(authMiddleware)
    .use(requireModeratorOrAdmin)
    .query(async ({ ctx }) => {
      try {
        const stats = await ctx.prisma.user.aggregate({
          where: { deletedAt: null },
          _count: {
            id: true,
          },
        });

        const roleStats = await ctx.prisma.user.groupBy({
          by: ['role'],
          where: { deletedAt: null, isActive: true },
          _count: {
            id: true,
          },
        });

        const activeStats = await ctx.prisma.user.aggregate({
          where: { 
            deletedAt: null,
            isActive: true,
          },
          _count: {
            id: true,
          },
        });

        return {
          total: stats._count.id,
          active: activeStats._count.id,
          inactive: stats._count.id - activeStats._count.id,
          byRole: roleStats.reduce((acc, stat) => {
            acc[stat.role] = stat._count.id;
            return acc;
          }, {} as Record<string, number>),
        };
      } catch (error) {
        console.error('Get user stats error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user statistics',
        });
      }
    }),
});