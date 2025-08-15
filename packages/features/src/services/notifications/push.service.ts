import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from '@repo/database';
import { Logger } from '@repo/utils/logger';

export class PushNotificationService {
  private expo: Expo;
  private logger = new Logger('PushNotification');
  
  constructor() {
    this.expo = new Expo();
  }
  
  async registerToken(
    userId: string,
    token: string,
    deviceInfo: {
      deviceId: string;
      platform: 'IOS' | 'ANDROID';
      deviceName?: string;
      appVersion?: string;
      osVersion?: string;
    }
  ) {
    // Validate token
    if (!Expo.isExpoPushToken(token)) {
      throw new Error('Invalid Expo push token');
    }
    
    // Store or update token
    await prisma.pushToken.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId: deviceInfo.deviceId,
        },
      },
      update: {
        token,
        platform: deviceInfo.platform,
        deviceName: deviceInfo.deviceName,
        appVersion: deviceInfo.appVersion,
        osVersion: deviceInfo.osVersion,
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        token,
        ...deviceInfo,
      },
    });
    
    this.logger.info(`Push token registered for user: ${userId}`);
  }
  
  async sendToUser(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: any;
      sound?: 'default' | null;
      badge?: number;
      categoryId?: string;
    }
  ) {
    // Get active tokens for user
    const tokens = await prisma.pushToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });
    
    if (tokens.length === 0) {
      this.logger.warn(`No active push tokens for user: ${userId}`);
      return;
    }
    
    // Create messages
    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token.token,
      sound: notification.sound || 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
      badge: notification.badge,
      categoryId: notification.categoryId,
    }));
    
    await this.sendBatch(messages);
  }
  
  async sendBroadcast(
    notification: {
      title: string;
      body: string;
      data?: any;
    },
    filter?: {
      role?: string;
      platform?: 'IOS' | 'ANDROID';
    }
  ) {
    // Get all active tokens with filter
    const where: any = { isActive: true };
    
    if (filter?.platform) {
      where.platform = filter.platform;
    }
    
    if (filter?.role) {
      where.user = { role: filter.role };
    }
    
    const tokens = await prisma.pushToken.findMany({
      where,
      select: { token: true },
    });
    
    if (tokens.length === 0) {
      this.logger.warn('No tokens found for broadcast');
      return;
    }
    
    // Create messages
    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token.token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
    }));
    
    await this.sendBatch(messages);
  }
  
  private async sendBatch(messages: ExpoPushMessage[]) {
    // Expo recommends sending at most 100 messages at once
    const chunks = this.chunk(messages, 100);
    const tickets: ExpoPushTicket[] = [];
    
    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        this.logger.error('Error sending push notifications:', error);
      }
    }
    
    // Store tickets for tracking
    await this.storeTickets(tickets, messages);
    
    // Schedule receipt check
    setTimeout(() => this.checkReceipts(tickets), 15 * 60 * 1000); // 15 minutes
  }
  
  private async storeTickets(
    tickets: ExpoPushTicket[],
    messages: ExpoPushMessage[]
  ) {
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const message = messages[i];
      
      if (ticket.status === 'error') {
        // Handle error
        if (ticket.details?.error === 'DeviceNotRegistered') {
          // Deactivate token
          await prisma.pushToken.updateMany({
            where: { token: message.to as string },
            data: { isActive: false },
          });
        }
        
        this.logger.error(`Push notification error: ${ticket.message}`, {
          error: ticket.details?.error,
          token: message.to,
        });
      }
    }
  }
  
  private async checkReceipts(tickets: ExpoPushTicket[]) {
    // Get receipt IDs from successful tickets
    const receiptIds = tickets
      .filter(ticket => ticket.status === 'ok')
      .map(ticket => ticket.id)
      .filter(id => id !== undefined) as string[];
    
    if (receiptIds.length === 0) {
      return;
    }
    
    try {
      const receiptIdChunks = this.chunk(receiptIds, 300);
      
      for (const chunk of receiptIdChunks) {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
        
        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          
          if (receipt.status === 'error') {
            this.logger.error(`Push notification delivery error: ${receipt.message}`, {
              receiptId,
              error: receipt.details?.error,
            });
            
            // Handle specific errors
            if (receipt.details?.error === 'DeviceNotRegistered') {
              // The token is no longer valid, deactivate it
              // Note: We'd need to store the mapping between receipt ID and token to do this
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error checking push notification receipts:', error);
    }
  }
  
  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}