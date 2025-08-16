import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import { prisma } from '@repo/database';
import { Queue } from 'bull';
import Redis from 'ioredis';
import { 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus,
  Platform 
} from '@repo/database';

interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  priority?: 'default' | 'high';
  sound?: 'default' | null;
  badge?: number;
  categoryId?: string;
  type?: NotificationType;
}

interface NotificationJob {
  messages: ExpoPushMessage[];
  userId?: string;
  logData: {
    title: string;
    body: string;
    type: NotificationType;
    priority: NotificationPriority;
  };
}

export class PushNotificationService {
  private expo: Expo;
  private notificationQueue: Queue<NotificationJob>;
  private redis: Redis;
  private logger: Console;
  
  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true, // Use FCM v1 for Android
    });
    
    this.notificationQueue = new Queue('notifications', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    });
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
    
    this.logger = console;
    this.setupQueueProcessors();
  }
  
  // Send notification to single user
  async sendToUser(
    userId: string,
    notification: NotificationPayload
  ): Promise<void> {
    try {
      // Get active push tokens
      const pushTokens = await prisma.pushToken.findMany({
        where: {
          userId,
          isActive: true,
          failureCount: { lt: 5 },
        },
      });
      
      if (pushTokens.length === 0) {
        this.logger.warn(`No active push tokens for user ${userId}`);
        return;
      }
      
      // Create messages
      const messages: ExpoPushMessage[] = pushTokens.map(token => ({
        to: token.token,
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          userId,
          timestamp: Date.now(),
        },
        priority: notification.priority || 'high',
        sound: notification.sound !== null ? notification.sound : 'default',
        badge: notification.badge,
        categoryId: notification.categoryId,
        channelId: 'default',
      }));
      
      // Queue for sending
      await this.notificationQueue.add('send', {
        messages,
        userId,
        logData: {
          title: notification.title,
          body: notification.body,
          type: notification.type || NotificationType.SYSTEM_ALERT,
          priority: NotificationPriority.NORMAL,
        },
      });
      
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }
  
  // Send to multiple users
  async sendToUsers(
    userIds: string[],
    notification: NotificationPayload
  ): Promise<void> {
    // Batch process
    const BATCH_SIZE = 100;
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(userId => this.sendToUser(userId, notification))
      );
    }
  }
  
  // Broadcast to all users
  async broadcast(
    notification: NotificationPayload,
    filter?: {
      role?: string;
      projectId?: string;
      isActive?: boolean;
    }
  ): Promise<void> {
    const where: any = {};
    
    if (filter?.role) where.role = filter.role;
    if (filter?.projectId) {
      where.projectAssignments = {
        some: { projectId: filter.projectId, isActive: true },
      };
    }
    if (filter?.isActive !== undefined) where.isActive = filter.isActive;
    
    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });
    
    await this.sendToUsers(
      users.map(u => u.id),
      notification
    );
  }
  
  // Process notification queue
  private setupQueueProcessors(): void {
    this.notificationQueue.process('send', async (job) => {
      const { messages, userId, logData } = job.data;
      
      try {
        // Chunk messages for Expo
        const chunks = this.expo.chunkPushNotifications(messages);
        const tickets: ExpoPushTicket[] = [];
        
        for (const chunk of chunks) {
          try {
            const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
          } catch (error) {
            this.logger.error('Failed to send chunk:', error);
          }
        }
        
        // Process tickets
        await this.processTickets(tickets, messages, userId);
        
        // Log notification
        await prisma.notificationLog.create({
          data: {
            userId,
            ...logData,
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });
        
      } catch (error: any) {
        this.logger.error('Notification processing failed:', error);
        
        // Log failure
        await prisma.notificationLog.create({
          data: {
            userId,
            ...logData,
            status: NotificationStatus.FAILED,
            error: error.message,
          },
        });
        
        throw error;
      }
    });
    
    // Check receipts periodically
    setInterval(() => this.checkReceipts(), 30000); // Every 30 seconds
  }
  
  // Process push tickets
  private async processTickets(
    tickets: ExpoPushTicket[],
    messages: ExpoPushMessage[],
    userId?: string
  ): Promise<void> {
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const message = messages[i];
      
      if (ticket.status === 'error') {
        await this.handleTicketError(ticket, message.to as string);
      } else if (ticket.status === 'ok' && ticket.id) {
        // Store receipt ID for later checking
        await this.redis.setex(
          `receipt:${ticket.id}`,
          3600, // 1 hour TTL
          JSON.stringify({ token: message.to, userId })
        );
      }
    }
  }
  
  // Handle token errors
  private async handleTicketError(
    ticket: ExpoPushTicket,
    token: string
  ): Promise<void> {
    if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
      // Deactivate invalid token
      await prisma.pushToken.update({
        where: { token },
        data: {
          isActive: false,
          lastError: ticket.message,
        },
      });
    } else if (ticket.status === 'error') {
      // Increment failure count
      await prisma.pushToken.update({
        where: { token },
        data: {
          failureCount: { increment: 1 },
          lastError: ticket.message,
        },
      });
    }
  }
  
  // Check notification receipts
  private async checkReceipts(): Promise<void> {
    const keys = await this.redis.keys('receipt:*');
    if (keys.length === 0) return;
    
    const receiptIds = keys.map(key => key.replace('receipt:', ''));
    const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
    
    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
        
        for (const [receiptId, receipt] of Object.entries(receipts)) {
          const data = await this.redis.get(`receipt:${receiptId}`);
          if (!data) continue;
          
          const { token, userId } = JSON.parse(data);
          
          if (receipt.status === 'error') {
            await this.handleReceiptError(receipt, token);
          }
          
          // Clean up processed receipt
          await this.redis.del(`receipt:${receiptId}`);
        }
      } catch (error) {
        this.logger.error('Failed to check receipts:', error);
      }
    }
  }
  
  private async handleReceiptError(receipt: ExpoPushReceipt, token: string): Promise<void> {
    if (receipt.status === 'error') {
      this.logger.error(`Receipt error for token ${token}:`, receipt);
      
      if (receipt.details?.error === 'DeviceNotRegistered') {
        await prisma.pushToken.update({
          where: { token },
          data: {
            isActive: false,
            lastError: receipt.message,
          },
        });
      }
    }
  }
  
  // Send notification for specific events
  async notifyTaskAssigned(taskId: string, assignedUserId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true, apartment: true },
    });
    
    if (!task) return;
    
    await this.sendToUser(assignedUserId, {
      title: 'New Task Assigned',
      body: `You've been assigned: ${task.title} at ${task.project.name}`,
      data: {
        type: NotificationType.TASK_ASSIGNED,
        taskId,
        projectId: task.projectId,
      },
      type: NotificationType.TASK_ASSIGNED,
    });
  }
  
  async notifyAttendanceReminder(userId: string, projectName: string): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Check-In Reminder',
      body: `Don't forget to check in at ${projectName}`,
      data: {
        type: NotificationType.ATTENDANCE_REMINDER,
      },
      type: NotificationType.ATTENDANCE_REMINDER,
    });
  }
  
  async notifyPaymentProcessed(userId: string, amount: number): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Payment Processed',
      body: `Your payment of $${amount.toFixed(2)} has been processed`,
      data: {
        type: NotificationType.PAYMENT_PROCESSED,
      },
      type: NotificationType.PAYMENT_PROCESSED,
    });
  }
  
  // Schedule a notification
  async scheduleNotification(
    userId: string | null,
    notification: NotificationPayload,
    scheduledFor: Date
  ): Promise<void> {
    await prisma.notificationSchedule.create({
      data: {
        userId,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        scheduledFor,
      },
    });
  }
  
  // Process scheduled notifications
  async processScheduledNotifications(): Promise<void> {
    const now = new Date();
    const scheduled = await prisma.notificationSchedule.findMany({
      where: {
        scheduledFor: { lte: now },
        status: NotificationStatus.PENDING,
      },
      take: 100,
    });
    
    for (const notification of scheduled) {
      try {
        if (notification.userId) {
          await this.sendToUser(notification.userId, {
            title: notification.title,
            body: notification.body,
            data: notification.data as any,
          });
        } else {
          await this.broadcast({
            title: notification.title,
            body: notification.body,
            data: notification.data as any,
          });
        }
        
        await prisma.notificationSchedule.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });
      } catch (error: any) {
        await prisma.notificationSchedule.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.FAILED,
            error: error.message,
            retryCount: { increment: 1 },
          },
        });
      }
    }
  }
  
  // Clean up old logs
  async cleanupOldLogs(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    await prisma.notificationLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });
  }
}

export const pushNotificationService = new PushNotificationService();