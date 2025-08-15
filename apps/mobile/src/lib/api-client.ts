import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import { MMKV } from 'react-native-mmkv';

// Storage for offline data
const storage = new MMKV({
  id: 'mobile-api-cache',
  encryptionKey: 'StarTynk-Mobile-Cache-Key',
});

// Sync queue storage
const syncStorage = new MMKV({
  id: 'sync-queue',
  encryptionKey: 'StarTynk-Sync-Queue-Key',
});

interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

interface CachedResponse {
  data: any;
  timestamp: number;
  ttl: number;
}

export class MobileApiClient {
  private client: AxiosInstance;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  
  constructor() {
    this.client = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL + '/mobile/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Type': 'mobile',
        'X-Platform': Platform.OS,
        'X-Device-ID': Device.deviceId || 'unknown',
        'X-App-Version': '1.0.0',
      },
    });
    
    this.setupInterceptors();
    this.setupNetworkListener();
  }
  
  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add compression header for large payloads
        if (config.data && JSON.stringify(config.data).length > 1024) {
          config.headers['Accept-Encoding'] = 'gzip';
        }
        
        // Handle offline mode for mutation requests
        if (!this.isOnline && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method!.toUpperCase())) {
          await this.queueRequest(config);
          throw new Error('OFFLINE_MODE');
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      async (response) => {
        // Cache successful GET responses
        if (response.config.method === 'get' && response.status === 200) {
          await this.cacheResponse(response.config.url!, response.data, 300); // 5 min TTL
        }
        
        return response;
      },
      async (error) => {
        // Handle offline mode
        if (error.message === 'OFFLINE_MODE') {
          return { 
            data: { 
              success: true, 
              offline: true, 
              queued: true,
              message: 'Request queued for sync when online'
            } 
          };
        }
        
        // Handle network errors with cache fallback
        if (!error.response && error.config?.method === 'get') {
          const cached = await this.getCachedResponse(error.config.url);
          if (cached) {
            return { 
              data: cached, 
              fromCache: true,
              headers: { 'x-from-cache': 'true' }
            };
          }
        }
        
        // Handle token refresh
        if (error.response?.status === 401 && !error.config._retry) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            error.config._retry = true;
            const token = await AsyncStorage.getItem('accessToken');
            error.config.headers.Authorization = `Bearer ${token}`;
            return this.client.request(error.config);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected || false;
      
      if (wasOffline && this.isOnline && !this.syncInProgress) {
        // Back online - sync queued requests
        this.syncOfflineData();
      }
    });
  }
  
  private async queueRequest(config: AxiosRequestConfig) {
    const requestId = await Crypto.randomUUID();
    const queuedRequest: QueuedRequest = {
      id: requestId,
      method: config.method!,
      url: config.url!,
      data: config.data,
      headers: config.headers as Record<string, string>,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    const existing = syncStorage.getString('queue');
    const queue: QueuedRequest[] = existing ? JSON.parse(existing) : [];
    queue.push(queuedRequest);
    
    syncStorage.set('queue', JSON.stringify(queue));
  }
  
  private async syncOfflineData() {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      const queueData = syncStorage.getString('queue');
      if (!queueData) {
        this.syncInProgress = false;
        return;
      }
      
      const queue: QueuedRequest[] = JSON.parse(queueData);
      const processed: string[] = [];
      
      for (const request of queue) {
        try {
          // Skip requests that are too old (>24 hours)
          if (Date.now() - request.timestamp > 24 * 60 * 60 * 1000) {
            processed.push(request.id);
            continue;
          }
          
          // Skip requests that have failed too many times
          if (request.retryCount >= 3) {
            processed.push(request.id);
            continue;
          }
          
          await this.client.request({
            method: request.method,
            url: request.url,
            data: request.data,
            headers: request.headers,
          });
          
          processed.push(request.id);
        } catch (error) {
          // Increment retry count for failed requests
          request.retryCount++;
          console.warn('Sync failed for request:', request.id, error);
        }
      }
      
      // Remove processed requests from queue
      const remainingQueue = queue.filter(req => !processed.includes(req.id));
      syncStorage.set('queue', JSON.stringify(remainingQueue));
      
    } catch (error) {
      console.error('Error during offline sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  private async cacheResponse(url: string, data: any, ttlSeconds: number) {
    const key = `cache_${url}`;
    const cached: CachedResponse = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    };
    storage.set(key, JSON.stringify(cached));
  }
  
  private async getCachedResponse(url: string): Promise<any | null> {
    const key = `cache_${url}`;
    const cachedData = storage.getString(key);
    
    if (cachedData) {
      const cached: CachedResponse = JSON.parse(cachedData);
      const age = Date.now() - cached.timestamp;
      
      if (age < cached.ttl) {
        return cached.data;
      } else {
        // Remove expired cache
        storage.delete(key);
      }
    }
    
    return null;
  }
  
  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return false;
      
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/mobile/v1/auth/refresh`,
        { refreshToken }
      );
      
      await AsyncStorage.setItem('accessToken', response.data.data.tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      
      return true;
    } catch (error) {
      // Refresh failed, redirect to login
      await this.clearTokens();
      return false;
    }
  }
  
  private async clearTokens() {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'lastSyncTimestamp']);
  }
  
  // Public API methods
  async login(identifier: string, password: string) {
    const deviceInfo = {
      deviceId: Device.deviceId || 'unknown',
      deviceName: Device.deviceName || undefined,
      platform: Platform.OS.toUpperCase() as 'IOS' | 'ANDROID',
      appVersion: '1.0.0',
      osVersion: Device.osVersion || undefined,
    };
    
    const response = await this.client.post('/auth/login', {
      identifier,
      password,
      ...deviceInfo,
    });
    
    if (response.data.success) {
      const { tokens } = response.data.data;
      await AsyncStorage.setItem('accessToken', tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
    }
    
    return response;
  }
  
  async logout() {
    await this.clearTokens();
    syncStorage.delete('queue');
    storage.clearAll();
  }
  
  async syncData() {
    const lastSync = await AsyncStorage.getItem('lastSyncTimestamp');
    
    const response = await this.client.post('/sync/pull', {
      lastSyncAt: lastSync,
      entities: ['projects', 'tasks', 'users'],
      deviceId: Device.deviceId || 'unknown',
    });
    
    if (response.data.success) {
      await AsyncStorage.setItem('lastSyncTimestamp', response.data.data.timestamp);
    }
    
    return response;
  }
  
  async pushOfflineChanges(changes: any[]) {
    return this.client.post('/sync/push', {
      changes,
      deviceId: Device.deviceId || 'unknown',
    });
  }
  
  async registerPushToken(token: string) {
    return this.client.post('/notifications/token', {
      token,
      deviceId: Device.deviceId || 'unknown',
      platform: Platform.OS.toUpperCase(),
      deviceName: Device.deviceName,
      appVersion: '1.0.0',
      osVersion: Device.osVersion,
    });
  }
  
  async getProjects(page: number = 1, limit: number = 10) {
    return this.client.get(`/projects?page=${page}&limit=${limit}`);
  }
  
  async getProject(id: string) {
    return this.client.get(`/projects/${id}`);
  }
  
  async getProjectTasks(id: string, page: number = 1, limit: number = 10, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }
    
    return this.client.get(`/projects/${id}/tasks?${params.toString()}`);
  }
  
  async getUserProfile() {
    return this.client.get('/users/profile');
  }
  
  // Cache management
  async clearCache() {
    storage.clearAll();
  }
  
  async getCacheSize(): Promise<number> {
    const keys = storage.getAllKeys();
    let totalSize = 0;
    
    for (const key of keys) {
      const data = storage.getString(key);
      if (data) {
        totalSize += data.length;
      }
    }
    
    return totalSize;
  }
  
  // Network status
  getNetworkStatus(): boolean {
    return this.isOnline;
  }
  
  // Queue status
  async getQueuedRequestsCount(): Promise<number> {
    const queueData = syncStorage.getString('queue');
    if (!queueData) return 0;
    
    const queue: QueuedRequest[] = JSON.parse(queueData);
    return queue.length;
  }
}

export default new MobileApiClient();