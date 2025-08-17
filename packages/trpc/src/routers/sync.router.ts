import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { prisma } from '@repo/database';
import { TRPCError } from '@trpc/server';
import { createHash } from 'crypto';

const SyncItemSchema = z.object({
  entityType: z.string(),
  entityId: z.string().optional(),
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  payload: z.any(),
  checksum: z.string(),
  localId: z.string().optional(),
});

const BatchSyncSchema = z.object({
  items: z.array(z.object({
    localId: z.string(),
    entityType: z.string(),
    entityId: z.string().optional(),
    operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
    payload: z.any(),
    checksum: z.string(),
  })),
});

export const syncRouter = router({
  // Sync single item
  syncItem: protectedProcedure
    .input(SyncItemSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { entityType, entityId, operation, payload, checksum, localId } = input;
      
      try {
        // Verify checksum
        const calculatedChecksum = createHash('md5')
          .update(JSON.stringify(payload))
          .digest('hex');
          
        if (calculatedChecksum !== checksum) {
          return {
            status: 'FAILED',
            error: 'Checksum mismatch',
          };
        }
        
        // Check for conflicts
        if (operation !== 'CREATE' && entityId) {
          const conflict = await checkConflict(entityType, entityId, payload);
          if (conflict) {
            return {
              status: 'CONFLICT',
              serverData: conflict.serverData,
              error: 'Data conflict detected',
            };
          }
        }
        
        // Apply the operation
        let result: any;
        let serverId: string | undefined;
        
        switch (operation) {
          case 'CREATE':
            result = await createEntity(entityType, payload, userId);
            serverId = result.id;
            break;
            
          case 'UPDATE':
            if (!entityId) {
              throw new Error('Entity ID required for UPDATE');
            }
            result = await updateEntity(entityType, entityId, payload, userId);
            serverId = entityId;
            break;
            
          case 'DELETE':
            if (!entityId) {
              throw new Error('Entity ID required for DELETE');
            }
            await deleteEntity(entityType, entityId, userId);
            serverId = entityId;
            break;
        }
        
        // Log successful sync
        await prisma.syncQueue.create({
          data: {
            userId,
            deviceId: (ctx as any).deviceId || 'unknown',
            entityType,
            entityId: localId,
            serverId,
            operation,
            payload,
            checksum,
            status: 'SUCCESS',
            syncedAt: new Date(),
            priority: 5,
          },
        });
        
        return {
          status: 'SUCCESS',
          serverId,
        };
        
      } catch (error: any) {
        console.error('Sync error:', error);
        
        // Log failed sync
        await prisma.syncQueue.create({
          data: {
            userId,
            deviceId: (ctx as any).deviceId || 'unknown',
            entityType,
            entityId: localId,
            operation,
            payload,
            checksum,
            status: 'FAILED',
            error: error.message,
            priority: 5,
          },
        });
        
        return {
          status: 'FAILED',
          error: error.message,
        };
      }
    }),
  
  // Batch sync
  syncBatch: protectedProcedure
    .input(BatchSyncSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { items } = input;
      const results: any[] = [];
      
      // Process items in order
      for (const item of items) {
        try {
          // Verify checksum
          const calculatedChecksum = createHash('md5')
            .update(JSON.stringify(item.payload))
            .digest('hex');
            
          if (calculatedChecksum !== item.checksum) {
            results.push({
              localId: item.localId,
              status: 'FAILED',
              error: 'Checksum mismatch',
            });
            continue;
          }
          
          // Check for conflicts
          if (item.operation !== 'CREATE' && item.entityId) {
            const conflict = await checkConflict(item.entityType, item.entityId, item.payload);
            if (conflict) {
              results.push({
                localId: item.localId,
                status: 'CONFLICT',
                serverData: conflict.serverData,
                error: 'Data conflict detected',
              });
              continue;
            }
          }
          
          // Apply the operation
          let result: any;
          let serverId: string | undefined;
          
          switch (item.operation) {
            case 'CREATE':
              result = await createEntity(item.entityType, item.payload, userId);
              serverId = result.id;
              break;
              
            case 'UPDATE':
              if (!item.entityId) {
                throw new Error('Entity ID required for UPDATE');
              }
              result = await updateEntity(item.entityType, item.entityId, item.payload, userId);
              serverId = item.entityId;
              break;
              
            case 'DELETE':
              if (!item.entityId) {
                throw new Error('Entity ID required for DELETE');
              }
              await deleteEntity(item.entityType, item.entityId, userId);
              serverId = item.entityId;
              break;
          }
          
          results.push({
            localId: item.localId,
            status: 'SUCCESS',
            serverId,
          });
          
        } catch (error: any) {
          results.push({
            localId: item.localId,
            status: 'FAILED',
            error: error.message,
          });
        }
      }
      
      // Create batch sync log
      const batchId = `batch_${Date.now()}`;
      await Promise.all(
        items.map((item, index) => 
          prisma.syncQueue.create({
            data: {
              userId,
              deviceId: (ctx as any).deviceId || 'unknown',
              entityType: item.entityType,
              entityId: item.localId,
              serverId: results[index].serverId,
              operation: item.operation,
              payload: item.payload,
              checksum: item.checksum,
              status: results[index].status,
              error: results[index].error,
              syncedAt: results[index].status === 'SUCCESS' ? new Date() : undefined,
              batchId,
              priority: 5,
            },
          })
        )
      );
      
      return { results };
    }),
  
  // Get updates since last sync
  getUpdates: protectedProcedure
    .input(z.object({
      since: z.date(),
      entities: z.array(z.string()),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { since, entities } = input;
      const updates: Record<string, any[]> = {};
      
      for (const entityType of entities) {
        switch (entityType) {
          case 'projects':
            updates.projects = await prisma.project.findMany({
              where: {
                projectAssignments: {
                  some: { userId, isActive: true },
                },
                updatedAt: { gt: since },
              },
              include: {
                developer: true,
                coordinator: true,
              },
            });
            break;
            
          case 'tasks':
            updates.tasks = await prisma.task.findMany({
              where: {
                assignments: {
                  some: { userId, isActive: true },
                },
                updatedAt: { gt: since },
              },
              include: {
                assignments: true,
                apartment: true,
              },
            });
            break;
            
          case 'attendance':
            updates.attendance = await prisma.attendance.findMany({
              where: {
                userId,
                updatedAt: { gt: since },
              },
            });
            break;
            
          case 'notifications':
            updates.notifications = await prisma.notificationLog.findMany({
              where: {
                userId,
                createdAt: { gt: since },
              },
              orderBy: { createdAt: 'desc' },
              take: 100,
            });
            break;
        }
      }
      
      return { data: updates };
    }),
  
  // Get sync status
  getSyncStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      
      const [pending, failed, lastSync] = await Promise.all([
        prisma.syncQueue.count({
          where: { userId, status: 'PENDING' },
        }),
        prisma.syncQueue.count({
          where: { userId, status: 'FAILED' },
        }),
        prisma.syncLog.findFirst({
          where: { userId },
          orderBy: { completedAt: 'desc' },
        }),
      ]);
      
      return {
        pendingCount: pending,
        failedCount: failed,
        lastSync: lastSync?.completedAt,
        isHealthy: failed === 0 && pending < 100,
      };
    }),
  
  // Retry failed items
  retryFailed: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.user.id;
      
      const failed = await prisma.syncQueue.updateMany({
        where: { userId, status: 'FAILED' },
        data: {
          status: 'PENDING',
          retryCount: { increment: 1 },
          error: null,
        },
      });
      
      return { retriedCount: failed.count };
    }),
  
  // Clear sync queue
  clearQueue: protectedProcedure
    .input(z.object({
      status: z.enum(['SUCCESS', 'FAILED', 'ALL']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { status } = input;
      
      const where: any = { userId };
      if (status && status !== 'ALL') {
        where.status = status;
      }
      
      const deleted = await prisma.syncQueue.deleteMany({ where });
      
      return { deletedCount: deleted.count };
    }),
});

// Helper functions

async function checkConflict(
  entityType: string,
  entityId: string,
  clientData: any
): Promise<{ serverData: any } | null> {
  let serverData: any;
  
  switch (entityType) {
    case 'attendance':
      serverData = await prisma.attendance.findUnique({
        where: { id: entityId },
      });
      break;
      
    case 'task':
      serverData = await prisma.task.findUnique({
        where: { id: entityId },
      });
      break;
      
    default:
      return null;
  }
  
  if (!serverData) {
    return null;
  }
  
  // Check if server version is newer
  const serverTimestamp = new Date(serverData.updatedAt).getTime();
  const clientTimestamp = new Date(clientData.updatedAt || clientData.timestamp).getTime();
  
  if (serverTimestamp > clientTimestamp) {
    return { serverData };
  }
  
  return null;
}

async function createEntity(
  entityType: string,
  data: any,
  userId: string
): Promise<any> {
  switch (entityType) {
    case 'attendance':
      return await prisma.attendance.create({
        data: {
          ...data,
          userId,
        },
      });
      
    case 'task':
      return await prisma.task.create({
        data: {
          ...data,
          createdById: userId,
        },
      });
      
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}

async function updateEntity(
  entityType: string,
  entityId: string,
  data: any,
  userId: string
): Promise<any> {
  // Remove read-only fields
  const { id, createdAt, ...updateData } = data;
  
  switch (entityType) {
    case 'attendance':
      // Verify ownership
      const attendance = await prisma.attendance.findUnique({
        where: { id: entityId },
      });
      
      if (!attendance || attendance.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot update this attendance record',
        });
      }
      
      return await prisma.attendance.update({
        where: { id: entityId },
        data: updateData,
      });
      
    case 'task':
      // Verify permission
      const task = await prisma.task.findUnique({
        where: { id: entityId },
        include: { assignments: true },
      });
      
      if (!task || !task.assignments.some(a => a.userId === userId && a.isActive)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot update this task',
        });
      }
      
      return await prisma.task.update({
        where: { id: entityId },
        data: updateData,
      });
      
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}

async function deleteEntity(
  entityType: string,
  entityId: string,
  userId: string
): Promise<void> {
  switch (entityType) {
    case 'attendance':
      const attendance = await prisma.attendance.findUnique({
        where: { id: entityId },
      });
      
      if (!attendance || attendance.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot delete this attendance record',
        });
      }
      
      await prisma.attendance.delete({
        where: { id: entityId },
      });
      break;
      
    default:
      throw new Error(`Delete not supported for entity type: ${entityType}`);
  }
}