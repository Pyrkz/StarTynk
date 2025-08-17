import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { 
  authMiddleware, 
  requireCoordinatorOrAbove,
  commonSchemas,
  searchFilterSchema 
} from '../middleware';
import { Role } from '@repo/shared';
import { isAuthenticatedContext } from '../context';

/**
 * Project creation schema
 */
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Name too long'),
  address: z.string().min(1, 'Address is required').max(500, 'Address too long'),
  developerId: commonSchemas.id,
  startDate: z.date(),
  endDate: z.date(),
  baseRate: z.number().positive('Base rate must be positive'),
  description: z.string().max(2000, 'Description too long').optional(),
  coordinatorId: commonSchemas.id.optional(),
});

/**
 * Project update schema
 */
const updateProjectSchema = z.object({
  id: commonSchemas.id,
  name: z.string().min(1, 'Project name is required').max(200, 'Name too long').optional(),
  address: z.string().min(1, 'Address is required').max(500, 'Address too long').optional(),
  developerId: commonSchemas.id.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  baseRate: z.number().positive('Base rate must be positive').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  coordinatorId: commonSchemas.id.optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
});

/**
 * Project filters schema
 */
const projectFiltersSchema = z.object({
  status: z.enum(['PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  developerId: commonSchemas.id.optional(),
  coordinatorId: commonSchemas.id.optional(),
  startDateFrom: z.date().optional(),
  startDateTo: z.date().optional(),
  endDateFrom: z.date().optional(),
  endDateTo: z.date().optional(),
  ...searchFilterSchema.shape,
});

/**
 * Apartment creation schema
 */
const createApartmentSchema = z.object({
  projectId: commonSchemas.id,
  number: z.string().min(1, 'Apartment number is required').max(20),
  floor: z.number().int().optional(),
  area: z.number().positive('Area must be positive').optional(),
  rooms: z.number().int().positive('Rooms must be positive').optional(),
  type: z.string().max(50).optional(),
});

/**
 * Project assignment schema
 */
const assignUserSchema = z.object({
  projectId: commonSchemas.id,
  userId: commonSchemas.id,
  role: z.string().max(100).optional(),
});

/**
 * Project router with full functionality
 */
export const projectRouter = router({
  /**
   * List projects with filtering and pagination
   */
  list: protectedProcedure
    .use(authMiddleware)
    .input(projectFiltersSchema)
    .query(async ({ input, ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const { 
        search, 
        status, 
        developerId, 
        coordinatorId,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,
        page, 
        limit, 
        sort = { field: 'name', order: 'asc' } 
      } = input;

      try {
        const where: any = {
          deletedAt: null,
        };

        // Apply filters
        if (status) where.status = status;
        if (developerId) where.developerId = developerId;
        if (coordinatorId) where.coordinatorId = coordinatorId;

        // Date range filters
        if (startDateFrom || startDateTo) {
          where.startDate = {};
          if (startDateFrom) where.startDate.gte = startDateFrom;
          if (startDateTo) where.startDate.lte = startDateTo;
        }

        if (endDateFrom || endDateTo) {
          where.endDate = {};
          if (endDateFrom) where.endDate.gte = endDateFrom;
          if (endDateTo) where.endDate.lte = endDateTo;
        }

        // Search filter
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }

        // Role-based filtering
        if (ctx.user.role === Role.WORKER) {
          // Workers can only see projects they're assigned to
          where.projectAssignments = {
            some: { userId: ctx.userId }
          };
        }

        // Count total records
        const total = await ctx.prisma.project.count({ where });

        // Fetch projects with pagination
        const projects = await ctx.prisma.project.findMany({
          where,
          select: {
            id: true,
            name: true,
            address: true,
            startDate: true,
            endDate: true,
            baseRate: true,
            status: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            developer: {
              select: {
                id: true,
                name: true,
              },
            },
            coordinator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                apartments: true,
                tasks: true,
                projectAssignments: true,
              },
            },
          },
          orderBy: { [sort.field]: sort.order },
          skip: (page - 1) * limit,
          take: limit,
        });

        return {
          data: projects,
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
        console.error('List projects error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch projects',
        });
      }
    }),

  /**
   * Get project by ID with detailed information
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

      try {
        const project = await ctx.prisma.project.findUnique({
          where: { 
            id,
            deletedAt: null,
          },
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                contact: true,
                email: true,
                phone: true,
              },
            },
            coordinator: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            apartments: {
              select: {
                id: true,
                number: true,
                floor: true,
                area: true,
                rooms: true,
                type: true,
                _count: {
                  select: {
                    tasks: true,
                  },
                },
              },
              orderBy: { number: 'asc' },
            },
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                area: true,
                rate: true,
                estimatedHours: true,
                actualHours: true,
                dueDate: true,
                apartment: {
                  select: {
                    id: true,
                    number: true,
                  },
                },
                assignments: {
                  select: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                    role: true,
                  },
                },
              },
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
            projectAssignments: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
                role: true,
                assignedDate: true,
              },
              where: {
                isActive: true,
                unassignedDate: null,
              },
            },
            _count: {
              select: {
                apartments: true,
                tasks: true,
                materialOrders: true,
                deliveries: true,
              },
            },
          },
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // Check access permissions
        if (ctx.user.role === Role.WORKER) {
          const hasAccess = project.projectAssignments.some(
            assignment => assignment.user.id === ctx.userId
          );
          
          if (!hasAccess) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Access denied to this project',
            });
          }
        }

        return project;
      } catch (error) {
        console.error('Get project error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch project',
        });
      }
    }),

  /**
   * Create new project
   */
  create: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(createProjectSchema)
    .mutation(async ({ input, ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const { developerId, coordinatorId, ...projectData } = input;

      try {
        // Verify developer exists
        const developer = await ctx.prisma.developer.findUnique({
          where: { id: developerId, isActive: true },
        });

        if (!developer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Developer not found',
          });
        }

        // Verify coordinator exists (if provided)
        if (coordinatorId) {
          const coordinator = await ctx.prisma.user.findUnique({
            where: { 
              id: coordinatorId,
              isActive: true,
              role: { in: [Role.COORDINATOR, Role.MODERATOR, Role.ADMIN] }
            },
          });

          if (!coordinator) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Coordinator not found or invalid role',
            });
          }
        }

        // Create project
        const project = await ctx.prisma.project.create({
          data: {
            ...projectData,
            developerId,
            coordinatorId,
            createdById: ctx.userId,
          },
          include: {
            developer: {
              select: {
                id: true,
                name: true,
              },
            },
            coordinator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        return project;
      } catch (error) {
        console.error('Create project error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create project',
        });
      }
    }),

  /**
   * Update project
   */
  update: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(updateProjectSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, developerId, coordinatorId, ...updateData } = input;

      try {
        // Check if project exists
        const existingProject = await ctx.prisma.project.findUnique({
          where: { id, deletedAt: null },
        });

        if (!existingProject) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // Verify developer exists (if changing)
        if (developerId) {
          const developer = await ctx.prisma.developer.findUnique({
            where: { id: developerId, isActive: true },
          });

          if (!developer) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Developer not found',
            });
          }
        }

        // Verify coordinator exists (if changing)
        if (coordinatorId) {
          const coordinator = await ctx.prisma.user.findUnique({
            where: { 
              id: coordinatorId,
              isActive: true,
              role: { in: [Role.COORDINATOR, Role.MODERATOR, Role.ADMIN] }
            },
          });

          if (!coordinator) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Coordinator not found or invalid role',
            });
          }
        }

        // Update project
        const updatedProject = await ctx.prisma.project.update({
          where: { id },
          data: {
            ...updateData,
            developerId,
            coordinatorId,
            updatedAt: new Date(),
          },
          include: {
            developer: {
              select: {
                id: true,
                name: true,
              },
            },
            coordinator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return updatedProject;
      } catch (error) {
        console.error('Update project error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update project',
        });
      }
    }),

  /**
   * Delete project (soft delete)
   */
  delete: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(z.object({ id: commonSchemas.id }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      try {
        // Check if project exists and has no active tasks
        const project = await ctx.prisma.project.findUnique({
          where: { id, deletedAt: null },
          include: {
            tasks: {
              where: {
                status: { in: ['NEW', 'IN_PROGRESS'] }
              }
            }
          }
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        if (project.tasks.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot delete project with active tasks',
          });
        }

        // Soft delete project
        await ctx.prisma.project.update({
          where: { id },
          data: {
            isActive: false,
            deletedAt: new Date(),
          },
        });

        return { success: true, message: 'Project deleted successfully' };
      } catch (error) {
        console.error('Delete project error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete project',
        });
      }
    }),

  /**
   * Add apartment to project
   */
  addApartment: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(createApartmentSchema)
    .mutation(async ({ input, ctx }) => {
      const { projectId, number, ...apartmentData } = input;

      try {
        // Check if project exists
        const project = await ctx.prisma.project.findUnique({
          where: { id: projectId, deletedAt: null },
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // Check if apartment number already exists in project
        const existingApartment = await ctx.prisma.apartment.findFirst({
          where: {
            projectId,
            number,
            deletedAt: null,
          },
        });

        if (existingApartment) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Apartment number already exists in this project',
          });
        }

        // Create apartment
        const apartment = await ctx.prisma.apartment.create({
          data: {
            projectId,
            number,
            ...apartmentData,
          },
        });

        return apartment;
      } catch (error) {
        console.error('Add apartment error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add apartment',
        });
      }
    }),

  /**
   * Assign user to project
   */
  assignUser: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(assignUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { projectId, userId, role } = input;

      try {
        // Check if project exists
        const project = await ctx.prisma.project.findUnique({
          where: { id: projectId, deletedAt: null },
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // Check if user exists
        const user = await ctx.prisma.user.findUnique({
          where: { id: userId, isActive: true },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Check if user is already assigned
        const existingAssignment = await ctx.prisma.projectAssignment.findFirst({
          where: {
            projectId,
            userId,
            isActive: true,
            unassignedDate: null,
          },
        });

        if (existingAssignment) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already assigned to this project',
          });
        }

        // Create assignment
        const assignment = await ctx.prisma.projectAssignment.create({
          data: {
            projectId,
            userId,
            role,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        });

        return assignment;
      } catch (error) {
        console.error('Assign user error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to assign user to project',
        });
      }
    }),

  /**
   * Get project statistics
   */
  getStats: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(z.object({ id: commonSchemas.id }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      try {
        const project = await ctx.prisma.project.findUnique({
          where: { id, deletedAt: null },
          include: {
            _count: {
              select: {
                apartments: true,
                tasks: true,
                projectAssignments: { where: { isActive: true } },
                materialOrders: true,
                deliveries: true,
              },
            },
          },
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // Get task statistics
        const taskStats = await ctx.prisma.task.groupBy({
          by: ['status'],
          where: { projectId: id, deletedAt: null },
          _count: { id: true },
        });

        // Get payment statistics
        const paymentStats = await ctx.prisma.paymentCalculation.aggregate({
          where: {
            task: { projectId: id, deletedAt: null }
          },
          _sum: { amount: true },
          _count: { id: true },
        });

        return {
          basic: project._count,
          tasks: taskStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.id;
            return acc;
          }, {} as Record<string, number>),
          payments: {
            totalAmount: paymentStats._sum.amount || 0,
            totalCalculations: paymentStats._count,
          },
        };
      } catch (error) {
        console.error('Get project stats error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch project statistics',
        });
      }
    }),
});