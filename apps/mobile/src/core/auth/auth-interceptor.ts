import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError, AxiosInstance } from 'axios';
import { tokenManager } from './token-manager';
import { env } from '../../config/environment';

/**
 * Enhanced HTTP interceptor with automatic token management
 * - Automatic token injection
 * - Token refresh on 401 errors
 * - Request queuing during refresh
 * - Security headers
 * - Request retry logic
 */

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

class AuthInterceptor {
  private isRefreshing = false;
  private failedQueue: QueuedRequest[] = [];

  constructor() {
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  /**
   * Setup request interceptor to inject tokens and security headers
   */
  private setupRequestInterceptor(): void {
    axios.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          // Get access token
          const token = await tokenManager.getAccessToken();
          
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
          }

          // Add security headers
          const deviceInfo = await tokenManager.getDeviceInfo();
          config.headers['X-Client-Type'] = 'mobile';
          config.headers['X-Device-Id'] = deviceInfo.id;
          config.headers['X-App-Version'] = deviceInfo.appVersion;
          config.headers['X-Platform'] = deviceInfo.platform;
          config.headers['User-Agent'] = this.getUserAgent(deviceInfo);

          // Add request timestamp for security
          config.headers['X-Request-Time'] = Date.now().toString();

          console.log(`🌐 ${config.method?.toUpperCase()} ${config.url} - Token: ${token ? 'present' : 'missing'}`);
          
          return config;
        } catch (error) {
          console.error('❌ Request interceptor error:', error);
          return config;
        }
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Setup response interceptor for token refresh and error handling
   */
  private setupResponseInterceptor(): void {
    axios.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log successful requests for monitoring
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log('🔄 401 error detected, attempting token refresh...');

          if (this.isRefreshing) {
            // Queue the request while refresh is in progress
            return new Promise<AxiosResponse>((resolve, reject) => {
              this.failedQueue.push({
                resolve: (token: string) => {
                  originalRequest.headers['Authorization'] = `Bearer ${token}`;
                  resolve(axios(originalRequest));
                },
                reject: (err: any) => {
                  reject(err);
                },
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshSuccess = await tokenManager.refreshTokens();

            if (refreshSuccess) {
              const newToken = await tokenManager.getAccessToken();
              
              if (newToken) {
                // Process queued requests
                this.processQueue(null, newToken);
                
                // Retry original request
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                
                console.log('✅ Token refreshed, retrying original request');
                return axios(originalRequest);
              }
            }

            // Refresh failed
            this.processQueue(new Error('Token refresh failed'), null);
            await this.handleAuthFailure();
            
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            this.processQueue(refreshError, null);
            await this.handleAuthFailure();
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other HTTP errors
        if (error.response) {
          this.handleHttpError(error);
        } else if (error.request) {
          this.handleNetworkError(error);
        } else {
          console.error('❌ Request setup error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      } else {
        reject(new Error('No token available'));
      }
    });

    this.failedQueue = [];
  }

  /**
   * Handle authentication failure (logout user)
   */
  private async handleAuthFailure(): Promise<void> {
    console.log('🔓 Authentication failed, clearing tokens');
    await tokenManager.clearTokens();
    
    // Navigate to login screen (implement based on your navigation structure)
    // NavigationService.navigate('Login');
  }

  /**
   * Handle HTTP errors with appropriate logging
   */
  private handleHttpError(error: AxiosError): void {
    const { response, config } = error;
    const status = response?.status;
    const method = config?.method?.toUpperCase();
    const url = config?.url;

    console.error(`❌ HTTP ${status} - ${method} ${url}`);

    switch (status) {
      case 400:
        console.error('🚫 Bad Request - Check request parameters');
        break;
      case 403:
        console.error('🔒 Forbidden - Insufficient permissions');
        break;
      case 404:
        console.error('🔍 Not Found - Endpoint does not exist');
        break;
      case 429:
        console.error('⏱️ Rate Limited - Too many requests');
        break;
      case 500:
        console.error('🔥 Server Error - Backend issue');
        break;
      case 502:
      case 503:
      case 504:
        console.error('🔧 Service Unavailable - Backend maintenance or overload');
        break;
      default:
        console.error(`❓ Unexpected HTTP error: ${status}`);
    }
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(error: AxiosError): void {
    console.error('🌐 Network Error:', error.message);
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('📶 No internet connection or server unreachable');
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout');
    } else {
      console.error('❓ Unknown network error');
    }
  }

  /**
   * Create authenticated axios instance
   */
  createAuthenticatedInstance(baseURL?: string): AxiosInstance {
    const instance = axios.create({
      baseURL: baseURL || env.current.apiUrl,
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Apply interceptors to this instance
    this.applyInterceptorsToInstance(instance);

    return instance;
  }

  /**
   * Apply interceptors to a specific axios instance
   */
  private applyInterceptorsToInstance(instance: AxiosInstance): void {
    // Request interceptor
    instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await tokenManager.getAccessToken();
        const deviceInfo = await tokenManager.getDeviceInfo();
        
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        config.headers['X-Client-Type'] = 'mobile';
        config.headers['X-Device-Id'] = deviceInfo.id;
        config.headers['X-App-Version'] = deviceInfo.appVersion;
        config.headers['X-Platform'] = deviceInfo.platform;
        config.headers['X-Request-Time'] = Date.now().toString();
        config.headers['User-Agent'] = this.getUserAgent(deviceInfo);

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor (same logic as global)
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Same error handling logic as global interceptor
        return this.handleResponseError(error, instance);
      }
    );
  }

  /**
   * Handle response errors for custom instances
   */
  private async handleResponseError(error: AxiosError, instance: AxiosInstance): Promise<any> {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshSuccess = await tokenManager.refreshTokens();
        
        if (refreshSuccess) {
          const newToken = await tokenManager.getAccessToken();
          
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return instance(originalRequest);
          }
        }
      } catch (refreshError) {
        await this.handleAuthFailure();
      }
    }

    return Promise.reject(error);
  }

  /**
   * Generate user agent string
   */
  private getUserAgent(deviceInfo: any): string {
    return `StarTynk/${deviceInfo.appVersion} (${deviceInfo.platform} ${deviceInfo.version}; Expo)`;
  }

  /**
   * Get current authentication status
   */
  async getAuthStatus(): Promise<{
    isAuthenticated: boolean;
    hasValidToken: boolean;
    tokenExpiresIn?: number;
  }> {
    try {
      const isAuthenticated = await tokenManager.isAuthenticated();
      const token = await tokenManager.getAccessToken();
      
      return {
        isAuthenticated,
        hasValidToken: !!token,
      };
    } catch (error) {
      console.error('❌ Failed to get auth status:', error);
      return {
        isAuthenticated: false,
        hasValidToken: false,
      };
    }
  }

  /**
   * Manual token refresh trigger
   */
  async refreshTokens(): Promise<boolean> {
    return tokenManager.refreshTokens();
  }

  /**
   * Clear authentication and logout
   */
  async logout(): Promise<void> {
    await tokenManager.clearTokens();
    await this.handleAuthFailure();
  }
}

// Export singleton instance
export const authInterceptor = new AuthInterceptor();

// Export authenticated axios instance for convenience
export const authenticatedApi = authInterceptor.createAuthenticatedInstance();