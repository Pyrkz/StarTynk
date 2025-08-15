import { prisma } from '@repo/database';
import { Logger } from '@repo/utils/logger';
import { SyncRequestDTO, SyncResponseDTO, SyncChangeDTO } from '@repo/shared/types/dto/mobile';

export class SyncService {
  private logger = new Logger('SyncService');
  
  async pullChanges(
    userId: string,
    request: SyncRequestDTO
  ): Promise<SyncResponseDTO> {
    const lastSync = request.lastSyncAt 
      ? new Date(request.lastSyncAt) 
      : new Date(0);
    
    const changes = {
      created: {} as Record<string, any[]>,
      updated: {} as Record<string, any[]>,
      deleted: {} as Record<string, string[]>,
    };
    
    // Fetch changes for each entity type
    for (const entity of request.entities) {
      switch (entity) {
        case 'projects':
          changes.created.projects = await this.getCreatedProjects(userId, lastSync);
          changes.updated.projects = await this.getUpdatedProjects(userId, lastSync);
          changes.deleted.projects = await this.getDeletedProjects(userId, lastSync);
          break;
        case 'tasks':
          changes.created.tasks = await this.getCreatedTasks(userId, lastSync);
          changes.updated.tasks = await this.getUpdatedTasks(userId, lastSync);
          changes.deleted.tasks = await this.getDeletedTasks(userId, lastSync);
          break;
        case 'users':
          changes.created.users = await this.getCreatedUsers(userId, lastSync);
          changes.updated.users = await this.getUpdatedUsers(userId, lastSync);
          changes.deleted.users = await this.getDeletedUsers(userId, lastSync);
          break;
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      changes,
      hasMore: false, // Implement pagination if needed
    };
  }
  
  async pushChanges(
    userId: string,
    changes: SyncChangeDTO[]
  ): Promise<{ success: boolean; conflicts: any[] }> {
    const conflicts = [];
    
    for (const change of changes) {
      try {
        await this.applySyncChange(userId, change);
      } catch (error) {
        if (this.isConflict(error)) {
          conflicts.push({
            ...change,
            serverVersion: await this.getServerVersion(change),
          });
        } else {
          throw error;
        }
      }
    }
    
    return {
      success: conflicts.length === 0,
      conflicts,
    };
  }
  
  private async applySyncChange(userId: string, change: SyncChangeDTO) {
    const { entityType, entityId, operation, payload, clientTimestamp } = change;
    
    // Add to sync queue for processing
    await prisma.syncQueue.create({
      data: {
        userId,
        entityType,
        entityId,
        operation,
        payload,
        status: 'PENDING',
      },
    });
    
    // Process based on operation
    switch (operation) {
      case 'CREATE':
        await this.handleCreate(entityType, payload, userId);
        break;
      case 'UPDATE':
        await this.handleUpdate(entityType, entityId, payload, clientTimestamp);
        break;
      case 'DELETE':
        await this.handleDelete(entityType, entityId);
        break;
    }
    
    // Mark as completed
    await prisma.syncQueue.updateMany({
      where: {
        userId,
        entityType,
        entityId,
        status: 'PENDING',
      },
      data: {
        status: 'COMPLETED',
        syncedAt: new Date(),
      },
    });
  }
  
  private async handleCreate(entityType: string, payload: any, userId: string) {
    const model = (prisma as any)[entityType];
    if (!model) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }
    
    // Add user context to payload
    const createData = {
      ...payload,
      createdById: userId,
    };
    
    await model.create({ data: createData });
  }
  
  private async handleUpdate(
    entityType: string,
    entityId: string,
    payload: any,
    clientTimestamp: string
  ) {
    // Check for conflicts using optimistic locking
    const model = (prisma as any)[entityType];
    const current = await model.findUnique({
      where: { id: entityId },
    });
    
    if (!current) {
      throw new Error('Entity not found');
    }
    
    // If server version is newer, we have a conflict
    if (current.updatedAt > new Date(clientTimestamp)) {
      throw new ConflictError('Version conflict', current);
    }
    
    // Apply update
    await model.update({
      where: { id: entityId },
      data: payload,
    });
  }
  
  private async handleDelete(entityType: string, entityId: string) {
    const model = (prisma as any)[entityType];
    
    // Soft delete by setting deletedAt
    await model.update({
      where: { id: entityId },
      data: { 
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
  
  // Helper methods for fetching changes
  private async getCreatedProjects(userId: string, since: Date) {
    return prisma.project.findMany({
      where: {
        OR: [
          { createdById: userId },
          { coordinatorId: userId },
          { projectAssignments: { some: { userId } } },
        ],
        createdAt: { gt: since },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        _count: {
          select: { tasks: true },
        },
      },
    });
  }
  
  private async getUpdatedProjects(userId: string, since: Date) {
    return prisma.project.findMany({
      where: {
        OR: [
          { createdById: userId },
          { coordinatorId: userId },
          { projectAssignments: { some: { userId } } },
        ],
        updatedAt: { gt: since },
        createdAt: { lte: since }, // Not newly created
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        _count: {
          select: { tasks: true },
        },
      },
    });
  }
  
  private async getDeletedProjects(userId: string, since: Date) {
    const deleted = await prisma.project.findMany({
      where: {
        OR: [
          { createdById: userId },
          { coordinatorId: userId },
          { projectAssignments: { some: { userId } } },
        ],
        deletedAt: { gt: since },
      },
      select: { id: true },
    });
    
    return deleted.map(p => p.id);
  }
  
  private async getCreatedTasks(userId: string, since: Date) {
    return prisma.task.findMany({
      where: {
        OR: [
          { project: { createdById: userId } },
          { project: { coordinatorId: userId } },
          { assignments: { some: { userId } } },
        ],
        createdAt: { gt: since },
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        assignments: {
          select: {
            userId: true,
            user: { select: { name: true } },
          },
        },
      },
    });
  }
  
  private async getUpdatedTasks(userId: string, since: Date) {
    return prisma.task.findMany({
      where: {
        OR: [
          { project: { createdById: userId } },
          { project: { coordinatorId: userId } },
          { assignments: { some: { userId } } },
        ],
        updatedAt: { gt: since },
        createdAt: { lte: since },
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        assignments: {
          select: {
            userId: true,
            user: { select: { name: true } },
          },
        },
      },
    });
  }
  
  private async getDeletedTasks(userId: string, since: Date) {
    const deleted = await prisma.task.findMany({
      where: {
        OR: [
          { project: { createdById: userId } },
          { project: { coordinatorId: userId } },
          { assignments: { some: { userId } } },
        ],
        deletedAt: { gt: since },
      },
      select: { id: true },
    });
    
    return deleted.map(t => t.id);
  }
  
  private async getCreatedUsers(userId: string, since: Date) {
    return prisma.user.findMany({
      where: {
        createdAt: { gt: since },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });
  }
  
  private async getUpdatedUsers(userId: string, since: Date) {
    return prisma.user.findMany({
      where: {
        updatedAt: { gt: since },
        createdAt: { lte: since },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });
  }
  
  private async getDeletedUsers(userId: string, since: Date) {
    const deleted = await prisma.user.findMany({
      where: {
        deletedAt: { gt: since },
      },
      select: { id: true },
    });
    
    return deleted.map(u => u.id);
  }
  
  private isConflict(error: any): boolean {
    return error instanceof ConflictError || 
           error.code === 'P2002'; // Prisma unique constraint error
  }
  
  private async getServerVersion(change: SyncChangeDTO) {
    const model = (prisma as any)[change.entityType];
    return model.findUnique({
      where: { id: change.entityId },
    });
  }
}

class ConflictError extends Error {
  constructor(message: string, public serverVersion: any) {
    super(message);
    this.name = 'ConflictError';
  }
}