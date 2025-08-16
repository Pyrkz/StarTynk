import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { prisma } from '@repo/database';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Event schemas
const SyncRequestSchema = z.object({
  entityType: z.string(),
  lastSync: z.string().datetime().optional(),
  deviceId: z.string(),
});

const SyncPushSchema = z.object({
  changes: z.array(z.object({
    entityType: z.string(),
    entityId: z.string().optional(),
    operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
    payload: z.any(),
    timestamp: z.string().datetime(),
  })),
  deviceId: z.string(),
});

const PresenceUpdateSchema = z.object({
  status: z.enum(['online', 'away', 'offline']),
  location: z.object({
    projectId: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
});

interface AuthenticatedSocket extends Socket {
  userId?: string;
  deviceId?: string;
  projectIds?: string[];
}

export class RealtimeSyncServer {
  private io: Server;
  private pubClient: Redis;
  private subClient: Redis;
  private userPresence: Map<string, { status: string; lastSeen: Date; location?: any }> = new Map();
  
  constructor(httpServer: any) {
    this.pubClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
    
    this.subClient = this.pubClient.duplicate();
    
    this.io = new Server(httpServer, {
      cors: {
        origin: [
          process.env.WEB_URL!,
          'http://localhost:3000',
          'http://localhost:8081',
          'exp://localhost:8081',
        ],
        credentials: true,
      },
      adapter: createAdapter(this.pubClient, this.subClient),
      transports: ['websocket', 'polling'],
    });
    
    this.setupMiddleware();
    this.setupHandlers();
    this.startPresenceMonitor();
  }
  
  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const deviceId = socket.handshake.auth.deviceId;
        
        if (!token || !deviceId) {
          return next(new Error('Authentication required'));
        }
        
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.userId;
        socket.deviceId = deviceId;
        
        // Load user's project assignments
        const assignments = await prisma.projectAssignment.findMany({
          where: { userId: decoded.userId, isActive: true },
          select: { projectId: true },
        });
        
        socket.projectIds = assignments.map(a => a.projectId);
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }
  
  private setupHandlers(): void {
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      const deviceId = socket.deviceId!;
      
      console.log(`User ${userId} connected from device ${deviceId}`);
      
      // Join user and device rooms
      socket.join(`user:${userId}`);
      socket.join(`device:${deviceId}`);
      
      // Join project rooms
      if (socket.projectIds) {
        for (const projectId of socket.projectIds) {
          socket.join(`project:${projectId}`);
        }
      }
      
      // Update presence
      this.updatePresence(userId, 'online');
      
      // Handle sync events
      socket.on('sync:request', async (data, callback) => {
        try {
          const validated = SyncRequestSchema.parse(data);
          const result = await this.handleSyncRequest(socket, validated);
          callback({ success: true, data: result });
        } catch (error: any) {
          callback({ success: false, error: error.message });
        }
      });
      
      socket.on('sync:push', async (data, callback) => {
        try {
          const validated = SyncPushSchema.parse(data);
          const result = await this.handleSyncPush(socket, userId, validated);
          callback({ success: true, data: result });
        } catch (error: any) {
          callback({ success: false, error: error.message });
        }
      });
      
      socket.on('presence:update', async (data) => {
        try {
          const validated = PresenceUpdateSchema.parse(data);
          await this.handlePresenceUpdate(socket, userId, validated);
        } catch (error) {
          console.error('Invalid presence update:', error);
        }
      });
      
      socket.on('subscribe:entity', (data) => {
        const { entityType, entityId } = data;
        socket.join(`${entityType}:${entityId}`);
      });
      
      socket.on('unsubscribe:entity', (data) => {
        const { entityType, entityId } = data;
        socket.leave(`${entityType}:${entityId}`);
      });
      
      socket.on('disconnect', () => {
        this.handleDisconnect(userId, deviceId);
      });
    });
  }
  
  private async handleSyncRequest(socket: AuthenticatedSocket, data: z.infer<typeof SyncRequestSchema>) {
    const { entityType, lastSync, deviceId } = data;
    const userId = socket.userId!;
    
    // Get changes since last sync
    const changes = await this.getChangesSince(userId, entityType, lastSync);
    
    // Log sync request
    await prisma.syncLog.create({
      data: {
        userId,
        deviceId,
        syncType: 'PARTIAL',
        direction: 'DOWNLOAD',
        entityCounts: { [entityType]: changes.length },
        startedAt: new Date(),
        completedAt: new Date(),
        status: 'SUCCESS',
      },
    });
    
    return {
      entityType,
      changes,
      timestamp: new Date().toISOString(),
    };
  }
  
  private async handleSyncPush(
    socket: AuthenticatedSocket,
    userId: string,
    data: z.infer<typeof SyncPushSchema>
  ) {
    const { changes, deviceId } = data;
    
    // Process changes
    const results = await this.processChanges(userId, changes);
    
    // Notify other devices
    socket.to(`user:${userId}`).emit('sync:update', {
      changes: results.accepted,
      deviceId,
      timestamp: new Date().toISOString(),
    });
    
    // Notify affected projects
    const affectedProjects = new Set<string>();
    for (const change of results.accepted) {
      if (change.entityType === 'attendance' || change.entityType === 'task') {
        const entity = await this.getEntity(change.entityType, change.entityId!);
        if (entity?.projectId) {
          affectedProjects.add(entity.projectId);
        }
      }
    }
    
    for (const projectId of affectedProjects) {
      socket.to(`project:${projectId}`).emit('project:update', {
        projectId,
        changes: results.accepted.filter(c => {
          // Filter changes relevant to this project
          return true; // Implement project filtering logic
        }),
      });
    }
    
    // Log sync
    await prisma.syncLog.create({
      data: {
        userId,
        deviceId,
        syncType: 'PARTIAL',
        direction: 'UPLOAD',
        entityCounts: this.countByEntityType(changes),
        startedAt: new Date(),
        completedAt: new Date(),
        status: results.conflicts.length > 0 ? 'CONFLICT' : 'SUCCESS',
        metadata: {
          accepted: results.accepted.length,
          rejected: results.rejected.length,
          conflicts: results.conflicts.length,
        },
      },
    });
    
    return {
      accepted: results.accepted,
      rejected: results.rejected,
      conflicts: results.conflicts,
    };
  }
  
  private async handlePresenceUpdate(
    socket: AuthenticatedSocket,
    userId: string,
    data: z.infer<typeof PresenceUpdateSchema>
  ) {
    const { status, location } = data;
    
    // Update presence
    this.updatePresence(userId, status, location);
    
    // Broadcast to relevant users
    const projectIds = socket.projectIds || [];
    for (const projectId of projectIds) {
      socket.to(`project:${projectId}`).emit('presence:update', {
        userId,
        status,
        location,
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  private handleDisconnect(userId: string, deviceId: string): void {
    console.log(`User ${userId} disconnected from device ${deviceId}`);
    
    // Check if user has other active connections
    const userSockets = this.io.sockets.adapter.rooms.get(`user:${userId}`);
    if (!userSockets || userSockets.size === 0) {
      // User is offline
      this.updatePresence(userId, 'offline');
    }
  }
  
  // Broadcast changes to relevant users
  async broadcastChange(
    entityType: string,
    entityId: string,
    change: any,
    affectedUsers: string[]
  ): Promise<void> {
    const event = `${entityType}:change`;
    
    for (const userId of affectedUsers) {
      this.io.to(`user:${userId}`).emit(event, {
        entityId,
        change,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Also broadcast to entity subscribers
    this.io.to(`${entityType}:${entityId}`).emit(event, {
      entityId,
      change,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Send push notification through WebSocket
  async sendPushNotification(userId: string, notification: any): Promise<void> {
    this.io.to(`user:${userId}`).emit('notification:push', notification);
  }
  
  // Get online users for a project
  getOnlineUsersForProject(projectId: string): string[] {
    const room = this.io.sockets.adapter.rooms.get(`project:${projectId}`);
    if (!room) return [];
    
    const onlineUsers = new Set<string>();
    for (const socketId of room) {
      const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket;
      if (socket?.userId) {
        onlineUsers.add(socket.userId);
      }
    }
    
    return Array.from(onlineUsers);
  }
  
  // Private helper methods
  
  private async getChangesSince(userId: string, entityType: string, since?: string): Promise<any[]> {
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    switch (entityType) {
      case 'attendance':
        return await prisma.attendance.findMany({
          where: {
            userId,
            updatedAt: { gt: sinceDate },
          },
          orderBy: { updatedAt: 'asc' },
        });
        
      case 'task':
        return await prisma.task.findMany({
          where: {
            assignments: {
              some: { userId, isActive: true },
            },
            updatedAt: { gt: sinceDate },
          },
          include: {
            assignments: true,
          },
          orderBy: { updatedAt: 'asc' },
        });
        
      default:
        return [];
    }
  }
  
  private async processChanges(userId: string, changes: any[]): Promise<{
    accepted: any[];
    rejected: any[];
    conflicts: any[];
  }> {
    const accepted: any[] = [];
    const rejected: any[] = [];
    const conflicts: any[] = [];
    
    for (const change of changes) {
      try {
        // Check for conflicts
        const conflict = await this.checkConflict(change);
        if (conflict) {
          conflicts.push({
            ...change,
            conflict,
          });
          continue;
        }
        
        // Apply change
        await this.applyChange(userId, change);
        accepted.push(change);
        
      } catch (error: any) {
        rejected.push({
          ...change,
          error: error.message,
        });
      }
    }
    
    return { accepted, rejected, conflicts };
  }
  
  private async checkConflict(change: any): Promise<any | null> {
    if (change.operation === 'CREATE') {
      return null; // No conflicts for create
    }
    
    const entity = await this.getEntity(change.entityType, change.entityId);
    if (!entity) {
      return null; // Entity doesn't exist
    }
    
    // Check if server version is newer
    if (entity.updatedAt > new Date(change.timestamp)) {
      return {
        serverVersion: entity,
        clientVersion: change.payload,
      };
    }
    
    return null;
  }
  
  private async applyChange(userId: string, change: any): Promise<void> {
    // Implementation depends on entity type and operation
    // This would integrate with your existing data layer
    console.log(`Applying change: ${change.operation} ${change.entityType}:${change.entityId}`);
  }
  
  private async getEntity(entityType: string, entityId: string): Promise<any | null> {
    switch (entityType) {
      case 'attendance':
        return await prisma.attendance.findUnique({ where: { id: entityId } });
      case 'task':
        return await prisma.task.findUnique({ where: { id: entityId } });
      default:
        return null;
    }
  }
  
  private countByEntityType(changes: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const change of changes) {
      counts[change.entityType] = (counts[change.entityType] || 0) + 1;
    }
    return counts;
  }
  
  private updatePresence(userId: string, status: string, location?: any): void {
    this.userPresence.set(userId, {
      status,
      lastSeen: new Date(),
      location,
    });
    
    // Cleanup old presence data
    if (this.userPresence.size > 1000) {
      const now = Date.now();
      for (const [uid, presence] of this.userPresence.entries()) {
        if (now - presence.lastSeen.getTime() > 24 * 60 * 60 * 1000) {
          this.userPresence.delete(uid);
        }
      }
    }
  }
  
  private startPresenceMonitor(): void {
    // Monitor and cleanup stale presence data
    setInterval(() => {
      const now = Date.now();
      for (const [userId, presence] of this.userPresence.entries()) {
        if (presence.status === 'online' && now - presence.lastSeen.getTime() > 5 * 60 * 1000) {
          // Mark as away after 5 minutes of inactivity
          this.updatePresence(userId, 'away');
        }
      }
    }, 60000); // Every minute
  }
}

export function createRealtimeSyncServer(httpServer: any): RealtimeSyncServer {
  return new RealtimeSyncServer(httpServer);
}