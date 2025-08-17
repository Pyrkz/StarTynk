import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../server';
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
const userFiltersSchema = searchFilterSchema.extend({
  role: z.nativeEnum(Role).optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
  employmentStatus: z.enum(['current', 'former', 'all']).default('current'),
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
        page = 1, 
        limit = 20, 
        sort
      } = input;
      
      // Ensure page and limit are properly typed numbers
      const pageNum = Number(page);
      const limitNum = Number(limit);
      
      // Handle sort with proper typing
      const sortField = (sort && typeof sort === 'object' && 'field' in sort && typeof sort.field === 'string') 
        ? sort.field : 'name';
      const sortOrder = (sort && typeof sort === 'object' && 'order' in sort && typeof sort.order === 'string') 
        ? sort.order as 'asc' | 'desc' : 'asc';

      try {
        const where: any = {
          deletedAt: null,
        };

        // Apply filters
        if (role) where.role = role;
        if (department) where.department = department;
        if (isActive !== undefined) where.isActive = isActive;

        // Handle complex filtering with AND/OR logic
        const andConditions: any[] = [];
        
        // Employment status filter  
        if (employmentStatus === 'current') {
          andConditions.push({
            OR: [
              { employmentEndDate: null },
              { employmentEndDate: { gt: new Date() } }
            ]
          });
        } else if (employmentStatus === 'former') {
          andConditions.push({
            employmentEndDate: { lte: new Date() }
          });
        }

        // Search filter
        if (search) {
          andConditions.push({
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { department: { contains: search, mode: 'insensitive' } },
              { position: { contains: search, mode: 'insensitive' } }
            ]
          });
        }
        
        // Apply AND conditions if any exist
        if (andConditions.length > 0) {
          where.AND = andConditions;
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
          orderBy: { [sortField]: sortOrder },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        });

        return {
          data: users,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1,
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
      if (ctx.userId !== id && !['ADMIN', 'MODERATOR'].includes(ctx.user.role)) {
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
        const orConditions: Array<{email: string} | {phone: string}> = [{ email: userData.email as string }];
        if (userData.phone) {
          orConditions.push({ phone: userData.phone as string });
        }
        
        const existingUser = await ctx.prisma.user.findFirst({
          where: {
            OR: orConditions,
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
        const hashedPassword = await PasswordUtils.hash(password as string);

        // Create user with proper type casting
        const validatedUserData = {
          email: userData.email as string,
          phone: userData.phone as string | undefined,
          name: userData.name as string,
          role: userData.role as Role,
          department: userData.department as string | undefined,
          position: userData.position as string | undefined,
          employmentStartDate: userData.employmentStartDate as Date | undefined,
          employmentEndDate: userData.employmentEndDate as Date | undefined,
        };

        const user = await ctx.prisma.user.create({
          data: {
            ...validatedUserData,
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
      const userId = id as string;

      // Users can update their own basic info, admins can update anyone
      const isOwnProfile = ctx.userId === userId;
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
          where: { id: userId, deletedAt: null },
        });

        if (!existingUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Check for email/phone conflicts if updating
        if (updateData.email || updateData.phone) {
          const conflictOrConditions = [];
          if (updateData.email) {
            conflictOrConditions.push({ email: updateData.email as string });
          }
          if (updateData.phone) {
            conflictOrConditions.push({ phone: updateData.phone as string });
          }
          
          const conflictWhere = {
            AND: [
              { id: { not: userId } },
              { OR: conflictOrConditions },
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

        // Update user with proper type casting
        const validatedUpdateData: any = {};
        
        // Only include defined fields with proper typing
        if (updateData.email !== undefined) validatedUpdateData.email = updateData.email as string;
        if (updateData.phone !== undefined) validatedUpdateData.phone = updateData.phone as string;
        if (updateData.name !== undefined) validatedUpdateData.name = updateData.name as string;
        if (updateData.role !== undefined) validatedUpdateData.role = updateData.role;
        if (updateData.department !== undefined) validatedUpdateData.department = updateData.department as string;
        if (updateData.position !== undefined) validatedUpdateData.position = updateData.position as string;
        if (updateData.employmentStartDate !== undefined) validatedUpdateData.employmentStartDate = updateData.employmentStartDate as Date;
        if (updateData.employmentEndDate !== undefined) validatedUpdateData.employmentEndDate = updateData.employmentEndDate as Date;
        if (updateData.isActive !== undefined) validatedUpdateData.isActive = updateData.isActive as boolean;
        
        const updatedUser = await ctx.prisma.user.update({
          where: { id: userId },
          data: {
            ...validatedUpdateData,
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