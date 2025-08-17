import { prisma } from '@repo/database';
import { Logger } from '@repo/utils';
import { PushNotificationService } from './push.service';
import * as cron from 'node-cron';

export class NotificationScheduler {
  private logger = new Logger('NotificationScheduler');
  private pushService: PushNotificationService;
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  
  constructor() {
    this.pushService = new PushNotificationService();
    this.initializeScheduler();
  }
  
  private initializeScheduler() {
    // Check for pending notifications every minute
    const job = cron.schedule('*/1 * * * *', async () => {
      await this.processPendingNotifications();
    }, {
      scheduled: false
    });
    
    job.start();
    this.jobs.set('pending', job);
    
    // Daily summary at 9 AM
    const dailySummaryJob = cron.schedule('0 9 * * *', async () => {
      await this.sendDailySummary();
    }, {
      scheduled: false
    });
    
    dailySummaryJob.start();
    this.jobs.set('dailySummary', dailySummaryJob);
  }
  
  async scheduleNotification(
    userId: string | null,
    notification: {
      title: string;
      body: string;
      data?: any;
    },
    scheduledFor: Date
  ) {
    await prisma.notificationSchedule.create({
      data: {
        userId,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        scheduledFor,
        status: 'PENDING',
      },
    });
    
    this.logger.info(`Notification scheduled for ${scheduledFor.toISOString()}`);
  }
  
  private async processPendingNotifications() {
    const now = new Date();
    
    const pending = await prisma.notificationSchedule.findMany({
      where: {
        scheduledFor: { lte: now },
        status: 'PENDING',
        retryCount: { lt: 3 },
      },
      include: { user: true },
    });
    
    for (const notification of pending) {
      try {
        if (notification.userId) {
          await this.pushService.sendToUser(notification.userId, {
            title: notification.title,
            body: notification.body,
            data: notification.data,
          });
        } else {
          await this.pushService.sendBroadcast({
            title: notification.title,
            body: notification.body,
            data: notification.data,
          });
        }
        
        await prisma.notificationSchedule.update({
          where: { id: notification.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });
      } catch (error) {
        this.logger.error(`Failed to send notification ${notification.id}:`, error);
        
        await prisma.notificationSchedule.update({
          where: { id: notification.id },
          data: {
            retryCount: { increment: 1 },
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  }
  
  private async sendDailySummary() {
    // Get all active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        taskAssignments: {
          where: {
            task: {
              status: { in: ['NEW', 'IN_PROGRESS'] },
              dueDate: {
                gte: new Date(),
                lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
            },
          },
          include: { task: true },
        },
      },
    });
    
    for (const user of users) {
      if (user.taskAssignments.length > 0) {
        await this.pushService.sendToUser(user.id, {
          title: 'Daily Summary',
          body: `You have ${user.taskAssignments.length} tasks due today`,
          data: {
            type: 'daily_summary',
            taskCount: user.taskAssignments.length,
          },
        });
      }
    }
  }
  
  stop() {
    for (const job of this.jobs.values()) {
      job.stop();
    }
    this.jobs.clear();
  }
}