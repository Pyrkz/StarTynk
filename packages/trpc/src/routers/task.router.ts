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
 * Task creation schema
 */
const createTaskSchema = z.object({
  projectId: commonSchemas.id,
  apartmentId: commonSchemas.id.optional(),
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  area: z.number().positive('Area must be positive'),
  rate: z.number().positive('Rate must be positive'),
  estimatedHours: z.number().int().positive('Estimated hours must be positive').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.date().optional(),
});

/**
 * Task update schema
 */
const updateTaskSchema = z.object({
  id: commonSchemas.id,
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  area: z.number().positive('Area must be positive').optional(),
  rate: z.number().positive('Rate must be positive').optional(),
  estimatedHours: z.number().int().positive('Estimated hours must be positive').optional(),
  actualHours: z.number().int().positive('Actual hours must be positive').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['NEW', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'APPROVED', 'PAID']).optional(),
  dueDate: z.date().optional(),
});

/**
 * Task filters schema
 */
const taskFiltersSchema = z.object({
  projectId: commonSchemas.id.optional(),
  apartmentId: commonSchemas.id.optional(),
  status: z.enum(['NEW', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'APPROVED', 'PAID']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedUserId: commonSchemas.id.optional(),
  dueDateFrom: z.date().optional(),
  dueDateTo: z.date().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  ...searchFilterSchema.shape,
});

/**
 * Task assignment schema
 */
const assignTaskSchema = z.object({
  taskId: commonSchemas.id,
  userId: commonSchemas.id,
  role: z.string().max(100).optional(),
});

/**
 * Quality control schema
 */
const createQualityControlSchema = z.object({
  taskId: commonSchemas.id,
  completionRate: z.number().int().min(0).max(100),
  notes: z.string().max(2000).optional(),
  issuesFound: z.string().max(2000).optional(),
  correctionsNeeded: z.string().max(2000).optional(),
  issueType: z.enum(['OUR_FAULT', 'EXTERNAL_FAULT', 'MATERIAL_DEFECT', 'DESIGN_ISSUE']).optional(),
});

/**
 * Payment calculation schema
 */
const createPaymentSchema = z.object({
  taskId: commonSchemas.id,
  completionRate: z.number().int().min(0).max(100),
  notes: z.string().max(500).optional(),
});

/**
 * Task router for task management and payments
 */
export const taskRouter = router({
  /**
   * List tasks with filtering and pagination
   */
  list: protectedProcedure
    .use(authMiddleware)
    .input(taskFiltersSchema)
    .query(async ({ input, ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const { 
        search, 
        projectId,
        apartmentId,
        status, 
        priority,
        assignedUserId,
        dueDateFrom,
        dueDateTo,
        createdAfter,
        createdBefore,
        page, 
        limit, 
        sort = { field: 'createdAt', order: 'asc' } 
      } = input;

      try {
        const where: any = {
          deletedAt: null,
        };

        // Apply filters
        if (projectId) where.projectId = projectId;
        if (apartmentId) where.apartmentId = apartmentId;
        if (status) where.status = status;
        if (priority) where.priority = priority;

        // Date filters
        if (dueDateFrom || dueDateTo) {
          where.dueDate = {};
          if (dueDateFrom) where.dueDate.gte = dueDateFrom;
          if (dueDateTo) where.dueDate.lte = dueDateTo;
        }

        if (createdAfter || createdBefore) {
          where.createdAt = {};
          if (createdAfter) where.createdAt.gte = createdAfter;
          if (createdBefore) where.createdAt.lte = createdBefore;
        }

        // Assignment filter
        if (assignedUserId) {
          where.assignments = {
            some: { userId: assignedUserId, isActive: true }
          };
        }

        // Search filter
        if (search) {
          where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { project: { name: { contains: search, mode: 'insensitive' } } },
            { apartment: { number: { contains: search, mode: 'insensitive' } } },
          ];
        }

        // Role-based filtering
        if (ctx.user.role === Role.WORKER) {
          // Workers can only see tasks assigned to them
          where.assignments = {
            some: { userId: ctx.userId, isActive: true }
          };
        }

        // Count total records
        const total = await ctx.prisma.task.count({ where });

        // Fetch tasks with pagination
        const tasks = await ctx.prisma.task.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            area: true,
            rate: true,
            status: true,
            priority: true,
            estimatedHours: true,
            actualHours: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
            apartment: {
              select: {
                id: true,
                number: true,
                floor: true,
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
              where: { isActive: true },
            },
            _count: {
              select: {
                qualityControls: true,
                payments: true,
              },
            },
          },
          orderBy: { [sort.field]: sort.order },
          skip: (page - 1) * limit,
          take: limit,
        });

        return {
          data: tasks,
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
        console.error('List tasks error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch tasks',
        });
      }
    }),

  /**
   * Get task by ID with detailed information
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
        const task = await ctx.prisma.task.findUnique({
          where: { 
            id,
            deletedAt: null,
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                address: true,
                status: true,
                baseRate: true,
              },
            },
            apartment: {
              select: {
                id: true,
                number: true,
                floor: true,
                area: true,
                rooms: true,
                type: true,
              },
            },
            assignments: {
              select: {
                id: true,
                role: true,
                createdAt: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
              },
              where: { isActive: true },
            },
            qualityControls: {
              select: {
                id: true,
                controlNumber: true,
                status: true,
                completionRate: true,
                notes: true,
                issuesFound: true,
                correctionsNeeded: true,
                controlDate: true,
                recontrolDate: true,
                issueType: true,
                controller: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: { controlDate: 'desc' },
            },
            payments: {
              select: {
                id: true,
                area: true,
                rate: true,
                completionRate: true,
                amount: true,
                isPaid: true,
                paidAt: true,
                notes: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!task) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          });
        }

        // Check access permissions
        if (ctx.user.role === Role.WORKER) {
          const hasAccess = task.assignments.some(
            assignment => assignment.user.id === ctx.userId
          );
          
          if (!hasAccess) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Access denied to this task',
            });
          }
        }

        return task;
      } catch (error) {
        console.error('Get task error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch task',
        });
      }
    }),

  /**
   * Create new task
   */
  create: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(createTaskSchema)
    .mutation(async ({ input, ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const { projectId, apartmentId, ...taskData } = input;

      try {
        // Verify project exists
        const project = await ctx.prisma.project.findUnique({
          where: { id: projectId, deletedAt: null },
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // Verify apartment exists and belongs to project (if provided)
        if (apartmentId) {
          const apartment = await ctx.prisma.apartment.findUnique({
            where: { 
              id: apartmentId,
              projectId,
              deletedAt: null,
            },
          });

          if (!apartment) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Apartment not found in this project',
            });
          }
        }

        // Create task
        const task = await ctx.prisma.task.create({
          data: {
            ...taskData,
            projectId,
            apartmentId,
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            apartment: {
              select: {
                id: true,
                number: true,
                floor: true,
              },
            },
          },
        });

        return task;
      } catch (error) {
        console.error('Create task error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create task',
        });
      }
    }),

  /**
   * Update task
   */
  update: protectedProcedure
    .use(authMiddleware)
    .input(updateTaskSchema)
    .mutation(async ({ input, ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const { id, ...updateData } = input;

      try {
        // Check if task exists
        const existingTask = await ctx.prisma.task.findUnique({
          where: { id, deletedAt: null },
          include: {
            assignments: {
              where: { userId: ctx.userId, isActive: true }
            }
          }
        });

        if (!existingTask) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          });
        }

        // Check permissions - coordinators/admins can update any task, workers can only update assigned tasks
        const isAssigned = existingTask.assignments.length > 0;
        const canUpdate = ['COORDINATOR', 'MODERATOR', 'ADMIN'].includes(ctx.user.role) || isAssigned;

        if (!canUpdate) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied to update this task',
          });
        }

        // Restrict what workers can update
        if (ctx.user.role === Role.WORKER && isAssigned) {
          const allowedFields = ['actualHours', 'status'];
          const restrictedFields = Object.keys(updateData).filter(
            key => !allowedFields.includes(key)
          );
          
          if (restrictedFields.length > 0) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `Workers cannot update fields: ${restrictedFields.join(', ')}`,
            });
          }

          // Workers can only change status to specific values
          if (updateData.status && !['IN_PROGRESS', 'READY_FOR_PICKUP'].includes(updateData.status)) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Workers can only set status to IN_PROGRESS or READY_FOR_PICKUP',
            });
          }
        }

        // Update task
        const updatedTask = await ctx.prisma.task.update({
          where: { id },
          data: {
            ...updateData,
            updatedAt: new Date(),
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            apartment: {
              select: {
                id: true,
                number: true,
                floor: true,
              },
            },
          },
        });

        return updatedTask;
      } catch (error) {
        console.error('Update task error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update task',
        });
      }
    }),

  /**
   * Delete task (soft delete)
   */
  delete: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(z.object({ id: commonSchemas.id }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      try {
        // Check if task exists and has no payments
        const task = await ctx.prisma.task.findUnique({
          where: { id, deletedAt: null },
          include: {
            payments: {
              where: { isPaid: true }
            }
          }
        });

        if (!task) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          });
        }

        if (task.payments.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot delete task with completed payments',
          });
        }

        // Soft delete task
        await ctx.prisma.task.update({
          where: { id },
          data: {
            isActive: false,
            deletedAt: new Date(),
          },
        });

        return { success: true, message: 'Task deleted successfully' };
      } catch (error) {
        console.error('Delete task error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete task',
        });
      }
    }),

  /**
   * Assign user to task
   */
  assignUser: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(assignTaskSchema)
    .mutation(async ({ input, ctx }) => {
      const { taskId, userId, role } = input;

      try {
        // Check if task exists
        const task = await ctx.prisma.task.findUnique({
          where: { id: taskId, deletedAt: null },
        });

        if (!task) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
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
        const existingAssignment = await ctx.prisma.taskAssignment.findFirst({
          where: {
            taskId,
            userId,
            isActive: true,
          },
        });

        if (existingAssignment) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already assigned to this task',
          });
        }

        // Create assignment
        const assignment = await ctx.prisma.taskAssignment.create({
          data: {
            taskId,
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
            task: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        });

        return assignment;
      } catch (error) {
        console.error('Assign user to task error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to assign user to task',
        });
      }
    }),

  /**
   * Create quality control entry
   */
  createQualityControl: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(createQualityControlSchema)
    .mutation(async ({ input, ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const { taskId, ...qualityData } = input;

      try {
        // Check if task exists
        const task = await ctx.prisma.task.findUnique({
          where: { id: taskId, deletedAt: null },
        });

        if (!task) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          });
        }

        // Get next control number for this task
        const lastControl = await ctx.prisma.qualityControl.findFirst({
          where: { taskId },
          orderBy: { controlNumber: 'desc' },
        });

        const controlNumber = (lastControl?.controlNumber || 0) + 1;

        // Create quality control
        const qualityControl = await ctx.prisma.qualityControl.create({
          data: {
            ...qualityData,
            taskId,
            controllerId: ctx.userId,
            controlNumber,
            status: qualityData.completionRate === 100 && !qualityData.issuesFound ? 'APPROVED' : 'PENDING',
          },
          include: {
            controller: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        return qualityControl;
      } catch (error) {
        console.error('Create quality control error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create quality control',
        });
      }
    }),

  /**
   * Create payment calculation
   */
  createPayment: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(createPaymentSchema)
    .mutation(async ({ input, ctx }) => {
      const { taskId, completionRate, notes } = input;

      try {
        // Check if task exists and get task details
        const task = await ctx.prisma.task.findUnique({
          where: { id: taskId, deletedAt: null },
          include: {
            qualityControls: {
              where: { status: 'APPROVED' },
              orderBy: { controlDate: 'desc' },
              take: 1,
            },
          },
        });

        if (!task) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          });
        }

        // Check if task has approved quality control
        if (task.qualityControls.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Task must have approved quality control before payment calculation',
          });
        }

        // Calculate payment amount (convert Decimal to number for calculation)
        const amount = (Number(task.area) * Number(task.rate) * completionRate) / 100;

        // Create payment calculation
        const payment = await ctx.prisma.paymentCalculation.create({
          data: {
            taskId,
            area: task.area,
            rate: task.rate,
            completionRate,
            amount,
            notes,
          },
          include: {
            task: {
              select: {
                id: true,
                title: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        return payment;
      } catch (error) {
        console.error('Create payment error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create payment calculation',
        });
      }
    }),

  /**
   * Mark payment as paid
   */
  markPaid: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(z.object({ 
      paymentId: commonSchemas.id,
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { paymentId, notes } = input;

      try {
        // Check if payment exists
        const payment = await ctx.prisma.paymentCalculation.findUnique({
          where: { id: paymentId, isActive: true },
          include: {
            task: true,
          },
        });

        if (!payment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Payment not found',
          });
        }

        if (payment.isPaid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Payment is already marked as paid',
          });
        }

        // Update payment and task status
        const [updatedPayment] = await ctx.prisma.$transaction([
          ctx.prisma.paymentCalculation.update({
            where: { id: paymentId },
            data: {
              isPaid: true,
              paidAt: new Date(),
              notes: notes || payment.notes,
            },
          }),
          ctx.prisma.task.update({
            where: { id: payment.taskId },
            data: { status: 'PAID' },
          }),
        ]);

        return { success: true, message: 'Payment marked as paid successfully' };
      } catch (error) {
        console.error('Mark payment as paid error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark payment as paid',
        });
      }
    }),

  /**
   * Get task statistics
   */
  getStats: protectedProcedure
    .use(authMiddleware)
    .input(z.object({ 
      projectId: commonSchemas.id.optional(),
      userId: commonSchemas.id.optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const { projectId, userId } = input;

      try {
        const baseWhere: any = { deletedAt: null };
        
        if (projectId) baseWhere.projectId = projectId;
        
        // If regular user, show only their assigned tasks
        if (ctx.user.role === Role.WORKER) {
          baseWhere.assignments = {
            some: { userId: ctx.userId, isActive: true }
          };
        } else if (userId) {
          baseWhere.assignments = {
            some: { userId, isActive: true }
          };
        }

        // Task count by status
        const statusStats = await ctx.prisma.task.groupBy({
          by: ['status'],
          where: baseWhere,
          _count: { id: true },
        });

        // Task count by priority
        const priorityStats = await ctx.prisma.task.groupBy({
          by: ['priority'],
          where: baseWhere,
          _count: { id: true },
        });

        // Payment statistics
        const paymentStats = await ctx.prisma.paymentCalculation.aggregate({
          where: {
            task: baseWhere,
            isActive: true,
          },
          _sum: { amount: true },
          _count: { id: true },
        });

        const paidStats = await ctx.prisma.paymentCalculation.aggregate({
          where: {
            task: baseWhere,
            isActive: true,
            isPaid: true,
          },
          _sum: { amount: true },
          _count: { id: true },
        });

        return {
          byStatus: statusStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.id;
            return acc;
          }, {} as Record<string, number>),
          byPriority: priorityStats.reduce((acc, stat) => {
            acc[stat.priority] = stat._count.id;
            return acc;
          }, {} as Record<string, number>),
          payments: {
            total: {
              amount: paymentStats._sum.amount || 0,
              count: paymentStats._count,
            },
            paid: {
              amount: paidStats._sum.amount || 0,
              count: paidStats._count,
            },
            pending: {
              amount: Number(paymentStats._sum.amount || 0) - Number(paidStats._sum.amount || 0),
              count: Number(paymentStats._count) - Number(paidStats._count),
            },
          },
        };
      } catch (error) {
        console.error('Get task stats error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch task statistics',
        });
      }
    }),
});