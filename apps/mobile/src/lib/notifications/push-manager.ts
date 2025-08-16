import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from '@repo/shared/storage';
import { trpc } from '../trpc';
import { router } from '@/navigation/router';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private token: string | null = null;
  private notificationListener: any;
  private responseListener: any;
  
  private constructor() {}
  
  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }
  
  async initialize(): Promise<void> {
    if (!Device.isDevice) {
      console.log('Push notifications work only on physical devices');
      return;
    }
    
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Push notification permission denied');
      return;
    }
    
    // Get Expo push token
    const token = await this.getExpoPushToken();
    if (token) {
      await this.registerToken(token);
    }
    
    // Setup listeners
    this.setupListeners();
    
    // Process any pending notifications
    await this.processPendingNotifications();
  }
  
  private async getExpoPushToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.extra?.projectId;
      if (!projectId) {
        console.error('Project ID not found in app config');
        return null;
      }
      
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      this.token = tokenResponse.data;
      
      // Store token locally using unified storage
      await storage.setItem('pushToken', this.token);
      
      return this.token;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }
  
  private async registerToken(token: string): Promise<void> {
    try {
      await trpc.notification.registerPushToken.mutate({
        token,
        platform: Platform.OS.toUpperCase() as 'IOS' | 'ANDROID',
        deviceId: Device.deviceId || 'unknown',
        deviceName: Device.deviceName || undefined,
        deviceModel: Device.modelName || undefined,
        osVersion: Device.osVersion || undefined,
        appVersion: Constants.expoConfig?.version || undefined,
        locale: 'en', // TODO: Get from device locale
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      
      console.log('Push token registered successfully');
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }
  
  private setupListeners(): void {
    // Handle received notifications
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      
      // Update badge count
      this.updateBadgeCount();
      
      // Handle in-app notification display
      this.handleInAppNotification(notification);
    });
    
    // Handle notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      this.handleNotificationTap(data);
    });
  }
  
  private handleInAppNotification(notification: Notifications.Notification): void {
    const { title, body } = notification.request.content;
    
    // You can show a custom in-app notification UI here
    // For now, we'll rely on the system notification
  }
  
  private handleNotificationTap(data: any): void {
    if (!data) return;
    
    // Navigate based on notification type
    switch (data.type) {
      case 'TASK_ASSIGNED':
        if (data.taskId) {
          router.push(`/tasks/${data.taskId}`);
        }
        break;
        
      case 'ATTENDANCE_REMINDER':
        router.push('/attendance');
        break;
        
      case 'PAYMENT_PROCESSED':
        router.push('/payroll');
        break;
        
      case 'CHAT_MESSAGE':
        if (data.chatId) {
          router.push(`/chats/${data.chatId}`);
        }
        break;
        
      case 'SCHEDULE_CHANGE':
        router.push('/schedule');
        break;
        
      default:
        // Navigate to notifications list
        router.push('/notifications');
    }
  }
  
  private async processPendingNotifications(): Promise<void> {
    // Check if app was opened from a notification
    const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastNotificationResponse) {
      const data = lastNotificationResponse.notification.request.content.data;
      this.handleNotificationTap(data);
    }
  }
  
  // Schedule local notification
  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Date | { seconds: number },
    data?: any
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger,
    });
  }
  
  // Cancel scheduled notification
  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }
  
  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
  
  // Get badge count
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }
  
  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }
  
  // Update badge count based on unread notifications
  async updateBadgeCount(): Promise<void> {
    try {
      // Get unread notification count from server
      const unreadCount = await trpc.notification.getUnreadCount.query();
      await this.setBadgeCount(unreadCount);
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }
  
  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await trpc.notification.markAsRead.mutate({ notificationId });
      await this.updateBadgeCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }
  
  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
  
  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
  
  // Update push token (e.g., after login)
  async updatePushToken(): Promise<void> {
    const token = await this.getExpoPushToken();
    if (token) {
      await this.registerToken(token);
    }
  }
  
  // Cleanup (e.g., on logout)
  async cleanup(): Promise<void> {
    // Remove listeners
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    
    // Clear badge
    await this.setBadgeCount(0);
    
    // Clear stored token using unified storage
    await storage.removeItem('pushToken');
    
    this.token = null;
  }
  
  // Schedule attendance reminder
  async scheduleAttendanceReminder(projectName: string, time: Date): Promise<string> {
    return await this.scheduleLocalNotification(
      'Check-In Reminder',
      `Don't forget to check in at ${projectName}`,
      time,
      { type: 'ATTENDANCE_REMINDER' }
    );
  }
  
  // Schedule task reminder
  async scheduleTaskReminder(taskTitle: string, dueDate: Date): Promise<string> {
    const reminderTime = new Date(dueDate);
    reminderTime.setHours(reminderTime.getHours() - 1); // 1 hour before
    
    return await this.scheduleLocalNotification(
      'Task Due Soon',
      `Task "${taskTitle}" is due in 1 hour`,
      reminderTime,
      { type: 'TASK_REMINDER' }
    );
  }
}

export const pushManager = PushNotificationManager.getInstance();