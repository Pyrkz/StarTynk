import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { 
  authMiddleware, 
  requireCoordinatorOrAbove,
  commonSchemas,
  searchFilterSchema 
} from '../middleware';
import { Role } from '@repo/shared';
import { isAuthenticatedContext } from '../context';

/**
 * Vehicle creation schema
 */
const createVehicleSchema = z.object({
  make: z.string().min(1, 'Make is required').max(50, 'Make too long'),
  model: z.string().min(1, 'Model is required').max(50, 'Model too long'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().min(1, 'License plate is required').max(20, 'License plate too long'),
  vin: z.string().max(17, 'VIN too long').optional(),
  insuranceExpiry: z.date().optional(),
  inspectionExpiry: z.date().optional(),
  purchaseDate: z.date().optional(),
  purchasePrice: z.number().positive('Purchase price must be positive').optional(),
});

/**
 * Vehicle update schema
 */
const updateVehicleSchema = z.object({
  id: commonSchemas.id,
  make: z.string().min(1, 'Make is required').max(50, 'Make too long').optional(),
  model: z.string().min(1, 'Model is required').max(50, 'Model too long').optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  licensePlate: z.string().min(1, 'License plate is required').max(20, 'License plate too long').optional(),
  vin: z.string().max(17, 'VIN too long').optional(),
  insuranceExpiry: z.date().optional(),
  inspectionExpiry: z.date().optional(),
  purchaseDate: z.date().optional(),
  purchasePrice: z.number().positive('Purchase price must be positive').optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'RETIRED']).optional(),
});

/**
 * Vehicle filters schema
 */
const vehicleFiltersSchema = z.object({
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'RETIRED']).optional(),
  assignedUserId: commonSchemas.id.optional(),
  make: z.string().optional(),
  year: z.number().int().optional(),
  insuranceExpiring: z.boolean().optional(), // Within 30 days
  inspectionExpiring: z.boolean().optional(), // Within 30 days
  ...searchFilterSchema.shape,
});

/**
 * Vehicle assignment schema
 */
const assignVehicleSchema = z.object({
  vehicleId: commonSchemas.id,
  userId: commonSchemas.id,
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

/**
 * Maintenance creation schema
 */
const createMaintenanceSchema = z.object({
  vehicleId: commonSchemas.id,
  type: z.enum(['INSPECTION', 'REPAIR', 'SERVICE', 'INSURANCE']),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  cost: z.number().positive('Cost must be positive'),
  serviceDate: z.date(),
  nextDueDate: z.date().optional(),
  mileage: z.number().int().positive('Mileage must be positive').optional(),
  serviceProvider: z.string().max(200, 'Service provider name too long').optional(),
  invoiceUrl: z.string().url('Invalid URL').optional(),
});

/**
 * Reminder creation schema
 */
const createReminderSchema = z.object({
  vehicleId: commonSchemas.id,
  type: z.enum(['INSPECTION', 'INSURANCE', 'SERVICE', 'REPAIR']),
  dueDate: z.date(),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  daysBefore: z.number().int().min(1).max(365).default(7),
});

/**
 * Vehicle router for vehicles and maintenance management
 */
export const vehicleRouter = router({
  /**
   * List vehicles with filtering and pagination
   */
  list: protectedProcedure
    .use(authMiddleware)
    .input(vehicleFiltersSchema)
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
        assignedUserId,
        make,
        year,
        insuranceExpiring,
        inspectionExpiring,
        page, 
        limit, 
        sortBy = 'licensePlate', 
        sortOrder 
      } = input;

      try {
        const where: any = {
          deletedAt: null,
        };

        // Apply filters
        if (status) where.status = status;
        if (make) where.make = { contains: make, mode: 'insensitive' };
        if (year) where.year = year;

        // Assignment filter
        if (assignedUserId) {
          where.assignments = {
            some: { 
              userId: assignedUserId, 
              isActive: true,
              OR: [
                { endDate: null },
                { endDate: { gt: new Date() } }
              ]
            }
          };
        }

        // Expiring insurance filter (within 30 days)
        if (insuranceExpiring) {
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          
          where.insuranceExpiry = {
            lte: thirtyDaysFromNow,
            gt: new Date(),
          };
        }

        // Expiring inspection filter (within 30 days)
        if (inspectionExpiring) {
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          
          where.inspectionExpiry = {
            lte: thirtyDaysFromNow,
            gt: new Date(),
          };
        }

        // Search filter
        if (search) {
          where.OR = [
            { make: { contains: search, mode: 'insensitive' } },
            { model: { contains: search, mode: 'insensitive' } },
            { licensePlate: { contains: search, mode: 'insensitive' } },
            { vin: { contains: search, mode: 'insensitive' } },
          ];
        }

        // Role-based filtering
        if (ctx.user.role === Role.WORKER) {
          // Workers can only see vehicles assigned to them
          where.assignments = {
            some: { 
              userId: ctx.userId, 
              isActive: true,
              OR: [
                { endDate: null },
                { endDate: { gt: new Date() } }
              ]
            }
          };
        }

        // Count total records
        const total = await ctx.prisma.vehicle.count({ where });

        // Fetch vehicles with pagination
        const vehicles = await ctx.prisma.vehicle.findMany({
          where,
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
            vin: true,
            status: true,
            insuranceExpiry: true,
            inspectionExpiry: true,
            purchaseDate: true,
            purchasePrice: true,
            createdAt: true,
            updatedAt: true,
            assignments: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                startDate: true,
                endDate: true,
              },
              where: {
                isActive: true,
                OR: [
                  { endDate: null },
                  { endDate: { gt: new Date() } }
                ]
              },
              take: 1,
            },
            _count: {
              select: {
                maintenances: true,
                reminders: { where: { isCompleted: false } },
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        });

        return {
          data: vehicles,
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
        console.error('List vehicles error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch vehicles',
        });
      }
    }),

  /**
   * Get vehicle by ID with detailed information
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
        const vehicle = await ctx.prisma.vehicle.findUnique({
          where: { 
            id,
            deletedAt: null,
          },
          include: {
            assignments: {
              select: {
                id: true,
                startDate: true,
                endDate: true,
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
              orderBy: { startDate: 'desc' },
              take: 10,
            },
            maintenances: {
              select: {
                id: true,
                type: true,
                description: true,
                cost: true,
                serviceDate: true,
                nextDueDate: true,
                mileage: true,
                serviceProvider: true,
                invoiceUrl: true,
                createdAt: true,
              },
              orderBy: { serviceDate: 'desc' },
              take: 10,
            },
            reminders: {
              select: {
                id: true,
                type: true,
                dueDate: true,
                description: true,
                daysBefore: true,
                isCompleted: true,
                createdAt: true,
              },
              orderBy: { dueDate: 'asc' },
              where: { isActive: true },
            },
          },
        });

        if (!vehicle) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vehicle not found',
          });
        }

        // Check access permissions
        if (ctx.user.role === Role.WORKER) {
          const hasAccess = vehicle.assignments.some(
            assignment => assignment.user.id === ctx.userId && 
                          assignment.endDate === null || assignment.endDate > new Date()
          );
          
          if (!hasAccess) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Access denied to this vehicle',
            });
          }
        }

        return vehicle;
      } catch (error) {
        console.error('Get vehicle error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch vehicle',
        });
      }
    }),

  /**
   * Create new vehicle
   */
  create: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(createVehicleSchema)
    .mutation(async ({ input, ctx }) => {
      const { licensePlate, ...vehicleData } = input;

      try {
        // Check if license plate already exists
        const existingVehicle = await ctx.prisma.vehicle.findUnique({
          where: { licensePlate },
        });

        if (existingVehicle) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Vehicle with this license plate already exists',
          });
        }

        // Create vehicle
        const vehicle = await ctx.prisma.vehicle.create({
          data: {
            ...vehicleData,
            licensePlate,
          },
        });

        return vehicle;
      } catch (error) {
        console.error('Create vehicle error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create vehicle',
        });
      }
    }),

  /**
   * Update vehicle
   */
  update: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(updateVehicleSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, licensePlate, ...updateData } = input;

      try {
        // Check if vehicle exists
        const existingVehicle = await ctx.prisma.vehicle.findUnique({
          where: { id, deletedAt: null },
        });

        if (!existingVehicle) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vehicle not found',
          });
        }

        // Check license plate conflict if updating
        if (licensePlate && licensePlate !== existingVehicle.licensePlate) {
          const conflictVehicle = await ctx.prisma.vehicle.findUnique({
            where: { licensePlate },
          });

          if (conflictVehicle) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'License plate already in use by another vehicle',
            });
          }
        }

        // Update vehicle
        const updatedVehicle = await ctx.prisma.vehicle.update({
          where: { id },
          data: {
            ...updateData,
            licensePlate,
            updatedAt: new Date(),
          },
        });

        return updatedVehicle;
      } catch (error) {
        console.error('Update vehicle error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update vehicle',
        });
      }
    }),

  /**
   * Delete vehicle (soft delete)
   */
  delete: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(z.object({ id: commonSchemas.id }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      try {
        // Check if vehicle exists and has no active assignments
        const vehicle = await ctx.prisma.vehicle.findUnique({
          where: { id, deletedAt: null },
          include: {
            assignments: {
              where: {
                isActive: true,
                OR: [
                  { endDate: null },
                  { endDate: { gt: new Date() } }
                ]
              }
            }
          }
        });

        if (!vehicle) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vehicle not found',
          });
        }

        if (vehicle.assignments.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot delete vehicle with active assignments',
          });
        }

        // Soft delete vehicle
        await ctx.prisma.vehicle.update({
          where: { id },
          data: {
            isActive: false,
            deletedAt: new Date(),
          },
        });

        return { success: true, message: 'Vehicle deleted successfully' };
      } catch (error) {
        console.error('Delete vehicle error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete vehicle',
        });
      }
    }),

  /**
   * Assign vehicle to user
   */
  assignVehicle: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(assignVehicleSchema)
    .mutation(async ({ input, ctx }) => {
      const { vehicleId, userId, startDate = new Date(), endDate } = input;

      try {
        // Check if vehicle exists and is available
        const vehicle = await ctx.prisma.vehicle.findUnique({
          where: { id: vehicleId, deletedAt: null, status: 'ACTIVE' },
          include: {
            assignments: {
              where: {
                isActive: true,
                OR: [
                  { endDate: null },
                  { endDate: { gt: new Date() } }
                ]
              }
            }
          }
        });

        if (!vehicle) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vehicle not found or not available',
          });
        }

        if (vehicle.assignments.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Vehicle is already assigned to another user',
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

        // Create assignment
        const assignment = await ctx.prisma.vehicleAssignment.create({
          data: {
            vehicleId,
            userId,
            startDate,
            endDate,
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
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        });

        return assignment;
      } catch (error) {
        console.error('Assign vehicle error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to assign vehicle',
        });
      }
    }),

  /**
   * Add maintenance record
   */
  addMaintenance: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(createMaintenanceSchema)
    .mutation(async ({ input, ctx }) => {
      const { vehicleId, ...maintenanceData } = input;

      try {
        // Check if vehicle exists
        const vehicle = await ctx.prisma.vehicle.findUnique({
          where: { id: vehicleId, deletedAt: null },
        });

        if (!vehicle) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vehicle not found',
          });
        }

        // Create maintenance record
        const maintenance = await ctx.prisma.vehicleMaintenance.create({
          data: {
            ...maintenanceData,
            vehicleId,
          },
          include: {
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        });

        return maintenance;
      } catch (error) {
        console.error('Add maintenance error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add maintenance record',
        });
      }
    }),

  /**
   * Create reminder
   */
  createReminder: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(createReminderSchema)
    .mutation(async ({ input, ctx }) => {
      const { vehicleId, ...reminderData } = input;

      try {
        // Check if vehicle exists
        const vehicle = await ctx.prisma.vehicle.findUnique({
          where: { id: vehicleId, deletedAt: null },
        });

        if (!vehicle) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vehicle not found',
          });
        }

        // Create reminder
        const reminder = await ctx.prisma.vehicleReminder.create({
          data: {
            ...reminderData,
            vehicleId,
          },
          include: {
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        });

        return reminder;
      } catch (error) {
        console.error('Create reminder error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create reminder',
        });
      }
    }),

  /**
   * Get vehicle statistics
   */
  getStats: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .query(async ({ ctx }) => {
      try {
        // Vehicle count by status
        const statusStats = await ctx.prisma.vehicle.groupBy({
          by: ['status'],
          where: { deletedAt: null },
          _count: { id: true },
        });

        // Maintenance costs
        const maintenanceStats = await ctx.prisma.vehicleMaintenance.aggregate({
          where: { 
            vehicle: { deletedAt: null },
            isActive: true,
          },
          _sum: { cost: true },
          _count: { id: true },
        });

        // Upcoming reminders (next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const upcomingReminders = await ctx.prisma.vehicleReminder.count({
          where: {
            vehicle: { deletedAt: null },
            isActive: true,
            isCompleted: false,
            dueDate: {
              lte: thirtyDaysFromNow,
              gte: new Date(),
            },
          },
        });

        // Assignments count
        const assignmentStats = await ctx.prisma.vehicleAssignment.count({
          where: {
            vehicle: { deletedAt: null },
            isActive: true,
            OR: [
              { endDate: null },
              { endDate: { gt: new Date() } }
            ]
          },
        });

        return {
          byStatus: statusStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.id;
            return acc;
          }, {} as Record<string, number>),
          maintenance: {
            totalCost: maintenanceStats._sum.cost || 0,
            totalRecords: maintenanceStats._count,
          },
          upcomingReminders,
          activeAssignments: assignmentStats,
        };
      } catch (error) {
        console.error('Get vehicle stats error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch vehicle statistics',
        });
      }
    }),

  /**
   * Get upcoming reminders
   */
  getUpcomingReminders: protectedProcedure
    .use(authMiddleware)
    .use(requireCoordinatorOrAbove)
    .input(z.object({
      days: z.number().int().min(1).max(365).default(30),
    }))
    .query(async ({ input, ctx }) => {
      const { days } = input;

      try {
        const daysFromNow = new Date();
        daysFromNow.setDate(daysFromNow.getDate() + days);

        const reminders = await ctx.prisma.vehicleReminder.findMany({
          where: {
            vehicle: { deletedAt: null },
            isActive: true,
            isCompleted: false,
            dueDate: {
              lte: daysFromNow,
              gte: new Date(),
            },
          },
          include: {
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                licensePlate: true,
              },
            },
          },
          orderBy: { dueDate: 'asc' },
        });

        return reminders;
      } catch (error) {
        console.error('Get upcoming reminders error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch upcoming reminders',
        });
      }
    }),
});