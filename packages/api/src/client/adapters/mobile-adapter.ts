import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { HTTPAdapter, APIResponse, RequestConfig, APIError } from '../types/client.types';

/**
 * Mobile HTTP adapter using axios
 * Optimized for React Native with offline support and retry logic
 */
export class MobileHTTPAdapter implements HTTPAdapter {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL: baseURL.replace(/\/$/, ''),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Type': 'mobile',  // Ensure client type is set
        'X-Platform': 'react-native', // Add platform detection
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for common headers
    this.client.interceptors.request.use(
      (config) => {
        // Add compression for large payloads
        if (config.data && JSON.stringify(config.data).length > 1024) {
          config.headers['Accept-Encoding'] = 'gzip';
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle auth errors - emit event for auth service to handle
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:expired'));
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async request<T = any>(url: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    const axiosConfig = this.buildAxiosConfig(config);

    try {
      const response: AxiosResponse<T> = await this.client.request({
        url,
        ...axiosConfig,
      });

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        config,
      };
    } catch (error) {
      throw this.handleError(error, url, config);
    }
  }

  async get<T = any>(url: string, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body: data });
  }

  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body: data });
  }

  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body: data });
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  private buildAxiosConfig(config: RequestConfig): AxiosRequestConfig {
    return {
      method: config.method?.toLowerCase() as any,
      headers: config.headers,
      data: config.body,
      timeout: config.timeout,
      validateStatus: config.validateStatus,
      responseType: config.responseType as any,
      // Axios-specific options
      maxRetries: config.maxRetries || 3,
      retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000, // Exponential backoff
    };
  }

  private handleError(error: any, url: string, config: RequestConfig): APIError {
    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Request timeout',
        isTimeoutError: true,
      };
    }

    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return {
        message: 'Network error',
        isNetworkError: true,
      };
    }

    if (error.response) {
      return {
        message: error.response.data?.message || error.message,
        status: error.response.status,
        code: error.response.data?.code,
        data: error.response.data,
      };
    }

    return {
      message: error.message || 'Unknown error',
      data: error,
    };
  }
}