import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { prisma } from '@repo/database';
import { pushNotificationService } from '@repo/features/services/notification/push-notification.service';
import { Platform } from '@repo/database';

const RegisterPushTokenSchema = z.object({
  token: z.string(),
  platform: z.enum(['IOS', 'ANDROID']),
  deviceId: z.string(),
  deviceName: z.string().optional(),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

export const notificationRouter = router({
  // Register push token
  registerPushToken: protectedProcedure
    .input(RegisterPushTokenSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      
      // Check if token already exists
      const existing = await prisma.pushToken.findUnique({
        where: { token: input.token },
      });
      
      if (existing) {
        // Update existing token
        const updated = await prisma.pushToken.update({
          where: { token: input.token },
          data: {
            userId,
            ...input,
            isActive: true,
            failureCount: 0,
            lastError: null,
            lastUsedAt: new Date(),
          },
        });
        
        return { success: true, tokenId: updated.id };
      }
      
      // Create new token
      const created = await prisma.pushToken.create({
        data: {
          userId,
          ...input,
        },
      });
      
      return { success: true, tokenId: created.id };
    }),
  
  // Unregister push token
  unregisterPushToken: protectedProcedure
    .input(z.object({
      deviceId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { deviceId } = input;
      
      await prisma.pushToken.updateMany({
        where: {
          userId,
          deviceId,
        },
        data: {
          isActive: false,
        },
      });
      
      return { success: true };
    }),
  
  // Get notification history
  getNotifications: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
      unreadOnly: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { limit, cursor, unreadOnly } = input;
      
      const where: any = { userId };
      if (unreadOnly) {
        where.readAt = null;
      }
      
      const notifications = await prisma.notificationLog.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });
      
      let nextCursor: string | undefined = undefined;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem!.id;
      }
      
      return {
        items: notifications,
        nextCursor,
      };
    }),
  
  // Get unread count
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const { userId } = ctx;
      
      const count = await prisma.notificationLog.count({
        where: {
          userId,
          readAt: null,
          status: 'DELIVERED',
        },
      });
      
      return count;
    }),
  
  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { notificationId } = input;
      
      await prisma.notificationLog.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          readAt: new Date(),
          status: 'READ',
        },
      });
      
      return { success: true };
    }),
  
  // Mark all as read
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { userId } = ctx;
      
      const updated = await prisma.notificationLog.updateMany({
        where: {
          userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
          status: 'READ',
        },
      });
      
      return { success: true, count: updated.count };
    }),
  
  // Send test notification
  sendTestNotification: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { userId } = ctx;
      
      await pushNotificationService.sendToUser(userId, {
        title: 'Test Notification',
        body: 'This is a test notification from StarTynk',
        data: {
          type: 'SYSTEM_ALERT',
          testId: Date.now().toString(),
        },
      });
      
      return { success: true };
    }),
  
  // Get notification preferences
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const { userId } = ctx;
      
      // This would fetch from a user preferences table
      // For now, return defaults
      return {
        taskAssigned: true,
        attendanceReminder: true,
        paymentProcessed: true,
        systemAlert: true,
        chatMessage: true,
        scheduleChange: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };
    }),
  
  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      taskAssigned: z.boolean().optional(),
      attendanceReminder: z.boolean().optional(),
      paymentProcessed: z.boolean().optional(),
      systemAlert: z.boolean().optional(),
      chatMessage: z.boolean().optional(),
      scheduleChange: z.boolean().optional(),
      quietHoursStart: z.string().optional(),
      quietHoursEnd: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      
      // This would update a user preferences table
      // For now, just return success
      return { success: true, preferences: input };
    }),
  
  // Schedule notification
  scheduleNotification: protectedProcedure
    .input(z.object({
      title: z.string(),
      body: z.string(),
      scheduledFor: z.date(),
      data: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      
      const scheduled = await prisma.notificationSchedule.create({
        data: {
          userId,
          title: input.title,
          body: input.body,
          scheduledFor: input.scheduledFor,
          data: input.data,
        },
      });
      
      return { success: true, scheduleId: scheduled.id };
    }),
  
  // Cancel scheduled notification
  cancelScheduledNotification: protectedProcedure
    .input(z.object({
      scheduleId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { scheduleId } = input;
      
      await prisma.notificationSchedule.updateMany({
        where: {
          id: scheduleId,
          userId,
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
        },
      });
      
      return { success: true };
    }),
  
  // Get device tokens
  getDeviceTokens: protectedProcedure
    .query(async ({ ctx }) => {
      const { userId } = ctx;
      
      const tokens = await prisma.pushToken.findMany({
        where: { userId },
        orderBy: { lastUsedAt: 'desc' },
      });
      
      return tokens.map(token => ({
        id: token.id,
        deviceId: token.deviceId,
        deviceName: token.deviceName,
        platform: token.platform,
        isActive: token.isActive,
        lastUsedAt: token.lastUsedAt,
        failureCount: token.failureCount,
      }));
    }),
  
  // Remove device token
  removeDeviceToken: protectedProcedure
    .input(z.object({
      tokenId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { tokenId } = input;
      
      await prisma.pushToken.deleteMany({
        where: {
          id: tokenId,
          userId,
        },
      });
      
      return { success: true };
    }),
});