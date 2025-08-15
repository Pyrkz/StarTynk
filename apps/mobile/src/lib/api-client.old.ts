import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  InternalAxiosRequestConfig 
} from 'axios';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { tokenStorage, TokenData } from './storage/token-storage';
import { environment } from './config/environment';
import { ApiResponseDTO, ErrorDTO } from '@repo/shared/types';

// Custom error class
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string | null> | null = null;
  private deviceId: string | null = null;

  constructor() {
    this.client = this.createClient();
    this.setupInterceptors();
    this.initializeDeviceId();
  }

  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: environment.getApiUrl(),
      timeout: environment.get().API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': 'mobile',
        'X-App-Version': environment.get().APP_VERSION,
        'X-Platform': Platform.OS,
        'X-Platform-Version': Platform.Version?.toString() || 'unknown',
      },
    });
  }

  private async initializeDeviceId(): Promise<void> {
    try {
      // Get unique device ID
      if (Device.isDevice) {
        this.deviceId = Device.osBuildId || Device.osInternalBuildId || null;
      } else {
        // Simulator/Emulator
        this.deviceId = 'simulator-' + Math.random().toString(36).substring(7);
      }
    } catch (error) {
      console.warn('Failed to get device ID:', error);
      this.deviceId = 'unknown-' + Date.now();
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add auth token
        const token = await tokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add device ID
        if (this.deviceId) {
          config.headers['X-Device-Id'] = this.deviceId;
        }

        // Add network info
        try {
          const networkState = await Network.getNetworkStateAsync();
          config.headers['X-Network-Type'] = networkState.type;
        } catch {}

        // Log request in development
        if (environment.isDevelopment()) {
          console.log('🚀 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            params: config.params,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (environment.isDevelopment()) {
          console.log('✅ API Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data,
          });
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Log error in development
        if (environment.isDevelopment()) {
          console.error('❌ API Error:', {
            url: originalRequest?.url,
            status: error.response?.status,
            message: error.response?.data?.error?.message || error.message,
          });
        }

        // Handle network errors
        if (!error.response) {
          const networkState = await Network.getNetworkStateAsync();
          if (!networkState.isConnected) {
            throw new ApiError(
              'No internet connection',
              'NETWORK_ERROR'
            );
          }
          throw new ApiError(
            'Network request failed',
            'NETWORK_ERROR'
          );
        }

        // Handle 401 - Token expired
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            await tokenStorage.clearTokens();
            // Emit event for app to handle navigation
            this.emitAuthError();
            throw new ApiError(
              'Session expired. Please login again.',
              'SESSION_EXPIRED',
              401
            );
          }
        }

        // Handle other errors
        throw this.handleApiError(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    const refreshToken = await tokenStorage.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        `${environment.getApiUrl()}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'X-Client-Type': 'mobile',
            'X-Device-Id': this.deviceId,
          },
        }
      );

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

      // Save new tokens
      await tokenStorage.saveTokens({
        accessToken,
        refreshToken: newRefreshToken || refreshToken,
        expiresAt: Date.now() + (expiresIn * 1000),
      });

      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  private handleApiError(error: any): ApiError {
    const response = error.response;
    
    if (!response) {
      return new ApiError(
        'An unexpected error occurred',
        'UNKNOWN_ERROR'
      );
    }

    const errorData: ErrorDTO = response.data?.error || {};
    
    return new ApiError(
      errorData.message || 'Request failed',
      errorData.code || 'API_ERROR',
      response.status,
      errorData.details
    );
  }

  private emitAuthError(): void {
    // Emit custom event for app to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }

  // Public API methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponseDTO<T>>(url, config);
    return response.data.data as T;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponseDTO<T>>(url, data, config);
    return response.data.data as T;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponseDTO<T>>(url, data, config);
    return response.data.data as T;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponseDTO<T>>(url, data, config);
    return response.data.data as T;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponseDTO<T>>(url, config);
    return response.data.data as T;
  }

  // File upload
  async upload<T = any>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
    const response = await this.client.post<ApiResponseDTO<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data.data as T;
  }

  // Get axios instance for advanced usage
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export convenience methods
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  upload: apiClient.upload.bind(apiClient),
};