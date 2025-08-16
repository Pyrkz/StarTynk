import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { EventEmitter } from 'events';
import { secureStorage } from '../storage/secure-storage';

interface RequestMetadata {
  startTime: number;
  retryCount: number;
  originalUrl: string;
}

interface QueuedRequest {
  config: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: 'high' | 'medium' | 'low';
}

interface NetworkError extends Error {
  isNetworkError: boolean;
  originalRequest?: AxiosRequestConfig;
}

interface RateLimitError extends Error {
  retryAfter: number;
}

class APIClient extends EventEmitter {
  private client: AxiosInstance;
  private refreshPromise: Promise<boolean> | null = null;
  private requestQueue: QueuedRequest[] = [];
  private isOnline = true;
  private isRefreshing = false;
  private baseURL: string;
  
  constructor() {
    super();
    
    // Get API URL from environment
    this.baseURL = Constants.expoConfig?.extra?.apiUrl || 
                   process.env.EXPO_PUBLIC_API_URL || 
                   'http://localhost:3000';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': Constants.expoConfig?.version || '1.0.0',
        'X-Platform': Platform.OS,
        'X-Client-Type': 'mobile',
      },
    });
    
    this.setupInterceptors();
    this.setupNetworkListener();
  }
  
  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token and metadata
    this.client.interceptors.request.use(
      async (config) => {
        // Add request metadata
        config.metadata = {
          startTime: Date.now(),
          retryCount: 0,
          originalUrl: config.url || '',
        } as RequestMetadata;
        
        // Add auth token if available
        try {
          const tokens = await secureStorage.getTokens();
          
          if (tokens?.accessToken) {
            // Check if token is about to expire (5 min buffer)
            if (await secureStorage.isTokenExpired()) {
              // Refresh token before request
              await this.refreshTokens();
              const newTokens = await secureStorage.getTokens();
              if (newTokens?.accessToken) {
                config.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              }
            } else {
              config.headers.Authorization = `Bearer ${tokens.accessToken}`;
            }
          }
        } catch (error) {
          console.error('Failed to add auth token:', error);
        }
        
        // Add device info
        try {
          const deviceInfo = await secureStorage.getDeviceInfo();
          config.headers['X-Device-ID'] = deviceInfo.id;
          config.headers['X-Device-Platform'] = deviceInfo.platform;
        } catch (error) {
          console.error('Failed to add device info:', error);
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor - handle auth errors and network issues
    this.client.interceptors.response.use(
      (response) => {
        // Log successful response metrics
        const duration = Date.now() - response.config.metadata?.startTime;
        this.emit('request:success', { 
          duration, 
          status: response.status,
          url: response.config.url 
        });
        
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { 
          _retry?: boolean;
          metadata?: RequestMetadata;
        };
        
        // Handle 401 - unauthorized/token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Prevent multiple simultaneous refresh attempts
          if (!this.refreshPromise) {
            this.refreshPromise = this.refreshTokens();
          }
          
          try {
            const refreshSuccess = await this.refreshPromise;
            this.refreshPromise = null;
            
            if (refreshSuccess) {
              // Retry original request with new token
              const newTokens = await secureStorage.getTokens();
              if (newTokens?.accessToken) {
                originalRequest.headers = {
                  ...originalRequest.headers,
                  Authorization: `Bearer ${newTokens.accessToken}`,
                };
                return this.client(originalRequest);
              }
            } else {
              // Refresh failed - logout user
              this.emit('auth:expired');
              throw new Error('Session expired. Please login again.');
            }
          } catch (refreshError) {
            this.refreshPromise = null;
            this.emit('auth:expired');
            throw new Error('Authentication failed. Please login again.');
          }
        }
        
        // Handle network errors
        if (!error.response) {
          const networkError: NetworkError = new Error('Network connection failed') as NetworkError;
          networkError.isNetworkError = true;
          networkError.originalRequest = originalRequest;
          
          this.emit('network:error', {
            error: networkError,
            url: originalRequest.url,
            method: originalRequest.method,
          });
          
          // Queue request for retry when back online
          if (this.isOnline) {
            this.queueRequest(originalRequest, error);
          }
          
          throw networkError;
        }
        
        // Handle rate limiting (429)
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          const rateLimitError: RateLimitError = new Error(
            `Rate limited. Retry after ${retryAfter} seconds`
          ) as RateLimitError;
          rateLimitError.retryAfter = retryAfter;
          
          this.emit('rate:limited', {
            retryAfter,
            url: originalRequest.url,
          });
          
          throw rateLimitError;
        }
        
        // Handle server errors (5xx) with retry
        if (error.response?.status >= 500) {
          const retryCount = originalRequest.metadata?.retryCount || 0;
          if (retryCount < 3) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
            
            return new Promise((resolve, reject) => {
              setTimeout(async () => {
                try {
                  originalRequest.metadata!.retryCount = retryCount + 1;
                  const response = await this.client(originalRequest);
                  resolve(response);
                } catch (retryError) {
                  reject(retryError);
                }
              }, delay);
            });
          }
        }
        
        // Log error metrics
        this.emit('request:error', {
          status: error.response?.status,
          message: error.message,
          url: originalRequest.url,
        });
        
        throw error;
      }
    );
  }
  
  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      this.emit('network:change', {
        isOnline: this.isOnline,
        connectionType: state.type,
        isInternetReachable: state.isInternetReachable,
      });
      
      // Process queued requests when back online
      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });
  }
  
  /**
   * Refresh authentication tokens
   */
  private async refreshTokens(): Promise<boolean> {
    try {
      if (this.isRefreshing) {
        // Wait for ongoing refresh
        return new Promise((resolve) => {
          const checkRefresh = () => {
            if (!this.isRefreshing) {
              resolve(true);
            } else {
              setTimeout(checkRefresh, 100);
            }
          };
          checkRefresh();
        });
      }
      
      this.isRefreshing = true;
      
      const tokens = await secureStorage.getTokens();
      if (!tokens?.refreshToken) {
        this.isRefreshing = false;
        return false;
      }
      
      const deviceInfo = await secureStorage.getDeviceInfo();
      
      const response = await axios.post(`${this.baseURL}/api/auth/refresh`, {
        refreshToken: tokens.refreshToken,
        deviceId: deviceInfo.id,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'mobile',
        },
        timeout: 10000,
      });
      
      if (response.data.success && response.data.accessToken) {
        await secureStorage.setTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken || tokens.refreshToken,
          expiresAt: Date.now() + (response.data.expiresIn * 1000),
        });
        
        this.emit('auth:refreshed');
        this.isRefreshing = false;
        return true;
      }
      
      this.isRefreshing = false;
      return false;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.isRefreshing = false;
      
      // Clear invalid tokens
      await secureStorage.clearTokens();
      return false;
    }
  }
  
  /**
   * Queue request for retry when online
   */
  private queueRequest(
    config: AxiosRequestConfig, 
    originalError: AxiosError,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        config,
        resolve,
        reject,
        priority,
      });
      
      // Sort queue by priority
      this.requestQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      this.emit('request:queued', {
        queueLength: this.requestQueue.length,
        priority,
      });
    });
  }
  
  /**
   * Process queued requests when back online
   */
  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.requestQueue.length === 0) return;
    
    this.emit('queue:processing', { queueLength: this.requestQueue.length });
    
    const queue = [...this.requestQueue];
    this.requestQueue = [];
    
    for (const queuedRequest of queue) {
      try {
        const response = await this.client(queuedRequest.config);
        queuedRequest.resolve(response);
      } catch (error) {
        queuedRequest.reject(error);
      }
    }
    
    this.emit('queue:processed');
  }
  
  /**
   * Make request with exponential backoff retry
   */
  async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on auth errors or client errors (4xx except 401)
        if (error.response?.status === 401 || 
            (error.response?.status >= 400 && error.response?.status < 500)) {
          throw error;
        }
        
        // Don't retry if it's the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * delay;
        const totalDelay = delay + jitter;
        
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Get current network status
   */
  getNetworkStatus(): { isOnline: boolean; queueLength: number } {
    return {
      isOnline: this.isOnline,
      queueLength: this.requestQueue.length,
    };
  }
  
  /**
   * Clear request queue
   */
  clearQueue(): void {
    this.requestQueue.forEach(request => {
      request.reject(new Error('Request queue cleared'));
    });
    this.requestQueue = [];
  }
  
  /**
   * Get axios instance for direct use
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
  
  /**
   * Make authenticated GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }
  
  /**
   * Make authenticated POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }
  
  /**
   * Make authenticated PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }
  
  /**
   * Make authenticated PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }
  
  /**
   * Make authenticated DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

// Create and export singleton instance
export const apiClient = new APIClient();