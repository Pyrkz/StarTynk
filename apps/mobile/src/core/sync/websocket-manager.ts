import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { EventEmitter } from 'events';

interface WebSocketConfig {
  url: string;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

interface SyncUpdate {
  changes: any[];
  deviceId: string;
  timestamp: string;
}

export class WebSocketManager extends EventEmitter {
  private static instance: WebSocketManager;
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private deviceId: string | null = null;
  
  private constructor() {
    super();
    this.config = {
      url: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3001',
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      timeout: 10000,
    };
  }
  
  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }
  
  async connect(token: string, userId: string, deviceId: string): Promise<void> {
    if (this.socket?.connected) {
      return;
    }
    
    this.userId = userId;
    this.deviceId = deviceId;
    
    // Check network connectivity
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No network connection, skipping WebSocket connection');
      return;
    }
    
    this.socket = io(this.config.url, {
      transports: ['websocket'],
      auth: {
        token,
        deviceId,
      },
      reconnection: true,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      timeout: this.config.timeout,
    });
    
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.emit('connected');
      
      // Update presence
      this.updatePresence('online');
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
    });
    
    // Sync events
    this.socket.on('sync:update', (data: SyncUpdate) => {
      console.log('Received sync update:', data);
      this.emit('sync:update', data);
    });
    
    this.socket.on('notification:push', (notification: any) => {
      console.log('Received push notification:', notification);
      this.emit('notification:push', notification);
    });
    
    // Entity-specific events
    this.socket.on('attendance:change', (data: any) => {
      this.emit('entity:change', { entityType: 'attendance', ...data });
    });
    
    this.socket.on('task:change', (data: any) => {
      this.emit('entity:change', { entityType: 'task', ...data });
    });
    
    this.socket.on('project:update', (data: any) => {
      this.emit('project:update', data);
    });
    
    // Presence events
    this.socket.on('presence:update', (data: any) => {
      this.emit('presence:update', data);
    });
  }
  
  // Request sync for specific entity type
  async requestSync(entityType: string, lastSync?: Date): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }
      
      this.socket.emit('sync:request', {
        entityType,
        lastSync: lastSync?.toISOString(),
        deviceId: this.deviceId,
      }, (response: any) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }
  
  // Push changes to server
  async pushChanges(changes: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }
      
      this.socket.emit('sync:push', {
        changes,
        deviceId: this.deviceId,
      }, (response: any) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }
  
  // Subscribe to entity changes
  subscribeToEntity(entityType: string, entityId: string): void {
    if (!this.socket?.connected) return;
    
    this.socket.emit('subscribe:entity', { entityType, entityId });
  }
  
  // Unsubscribe from entity changes
  unsubscribeFromEntity(entityType: string, entityId: string): void {
    if (!this.socket?.connected) return;
    
    this.socket.emit('unsubscribe:entity', { entityType, entityId });
  }
  
  // Update user presence
  updatePresence(status: 'online' | 'away' | 'offline', location?: any): void {
    if (!this.socket?.connected) return;
    
    this.socket.emit('presence:update', { status, location });
  }
  
  // Check if connected
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
  
  // Disconnect
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.isConnected = false;
    this.userId = null;
    this.deviceId = null;
  }
  
  // Force reconnect
  async reconnect(): Promise<void> {
    this.disconnect();
    
    const token = await AsyncStorage.getItem('authToken');
    if (token && this.userId && this.deviceId) {
      await this.connect(token, this.userId, this.deviceId);
    }
  }
  
  // Setup auto-reconnect on network changes
  setupNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.isConnected) {
        // Network is back, try to reconnect
        this.reconnect().catch(console.error);
      }
    });
  }
}

export const wsManager = WebSocketManager.getInstance();