import type { HTTPAdapter, APIResponse, RequestConfig, APIError } from '../types/client.types';

/**
 * Web HTTP adapter using native fetch API
 * Optimized for browser environment with standard caching
 */
export class WebHTTPAdapter implements HTTPAdapter {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, '');
  }

  async request<T = any>(url: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    const fullUrl = this.buildUrl(url);
    const fetchConfig = await this.buildFetchConfig(config);

    try {
      const response = await fetch(fullUrl, fetchConfig);
      
      if (!this.isSuccessStatus(response.status, config.validateStatus)) {
        throw await this.createErrorFromResponse(response);
      }

      const data = await this.parseResponse<T>(response, config.responseType);
      
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: this.extractHeaders(response.headers),
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

  private buildUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Map old auth endpoints to unified ones
    if (url === '/auth/login') {
      url = '/v1/auth/unified-login';
    } else if (url === '/auth/register') {
      url = '/v1/auth/unified-register';
    }
    
    return `${this.baseURL}${url.startsWith('/') ? url : `/${url}`}`;
  }

  private async buildFetchConfig(config: RequestConfig): Promise<RequestInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Type': 'web',  // Ensure client type is set
      ...config.headers,
    };

    const fetchConfig: RequestInit = {
      method: config.method || 'GET',
      headers,
      cache: config.cache || 'default',
    };

    // Handle request body
    if (config.body) {
      if (typeof config.body === 'object' && !(config.body instanceof FormData)) {
        fetchConfig.body = JSON.stringify(config.body);
      } else {
        fetchConfig.body = config.body;
        // Remove Content-Type for FormData (browser sets it automatically)
        if (config.body instanceof FormData) {
          delete headers['Content-Type'];
        }
      }
    }

    // Handle timeout
    if (config.timeout) {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), config.timeout);
      fetchConfig.signal = controller.signal;
    }

    return fetchConfig;
  }

  private async parseResponse<T>(response: Response, responseType: string = 'json'): Promise<T> {
    switch (responseType) {
      case 'text':
        return (await response.text()) as T;
      case 'blob':
        return (await response.blob()) as T;
      case 'arraybuffer':
        return (await response.arrayBuffer()) as T;
      case 'json':
      default:
        const text = await response.text();
        return text ? JSON.parse(text) : (null as T);
    }
  }

  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private isSuccessStatus(status: number, validateStatus?: (status: number) => boolean): boolean {
    if (validateStatus) {
      return validateStatus(status);
    }
    return status >= 200 && status < 300;
  }

  private async createErrorFromResponse(response: Response): Promise<APIError> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }

    return {
      message: errorData?.message || response.statusText || `HTTP ${response.status}`,
      status: response.status,
      code: errorData?.code,
      data: errorData,
    };
  }

  private handleError(error: any, url: string, config: RequestConfig): APIError {
    if (error.name === 'AbortError') {
      return {
        message: 'Request timeout',
        isTimeoutError: true,
      };
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Network error',
        isNetworkError: true,
      };
    }

    if (error.status) {
      return error; // Already an APIError
    }

    return {
      message: error.message || 'Unknown error',
      data: error,
    };
  }
}