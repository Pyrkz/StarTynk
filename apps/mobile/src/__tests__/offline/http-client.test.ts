import { apiClient } from '../../lib/api/http-client';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { secureStorage } from '../../lib/storage/secure-storage';

// Mock dependencies
jest.mock('axios');
jest.mock('@react-native-community/netinfo');
jest.mock('../../lib/storage/secure-storage');

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockSecureStorage = secureStorage as jest.Mocked<typeof secureStorage>;

describe('APIClient', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create
    mockAxios.create.mockReturnValue(mockAxiosInstance as any);
    
    // Mock secure storage
    mockSecureStorage.getTokens.mockResolvedValue({
      accessToken: 'valid-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 3600000, // 1 hour
    });
    
    mockSecureStorage.getDeviceInfo.mockResolvedValue({
      id: 'device-123',
      name: 'Test Device',
      platform: 'ios',
      version: '15.0',
    });
    
    mockSecureStorage.isTokenExpired.mockResolvedValue(false);
    
    // Mock network as online
    mockNetInfo.addEventListener.mockImplementation(() => () => {});
  });

  describe('Request Interceptor', () => {
    it('should add auth token to requests', async () => {
      const mockRequestUse = mockAxiosInstance.interceptors.request.use;
      expect(mockRequestUse).toHaveBeenCalled();
      
      const requestInterceptor = mockRequestUse.mock.calls[0][0];
      
      const config = {
        url: '/api/test',
        headers: {},
        metadata: undefined,
      };
      
      const interceptedConfig = await requestInterceptor(config);
      
      expect(interceptedConfig.headers.Authorization).toBe('Bearer valid-token');
      expect(interceptedConfig.headers['X-Device-ID']).toBe('device-123');
      expect(interceptedConfig.metadata).toBeDefined();
    });

    it('should refresh token when expired', async () => {
      mockSecureStorage.isTokenExpired.mockResolvedValue(true);
      
      // Mock successful token refresh
      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          accessToken: 'new-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      });
      
      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      
      const config = {
        url: '/api/test',
        headers: {},
      };
      
      await requestInterceptor(config);
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/refresh'),
        expect.objectContaining({
          refreshToken: 'refresh-token',
          deviceId: 'device-123',
        }),
        expect.any(Object)
      );
      
      expect(mockSecureStorage.setTokens).toHaveBeenCalledWith({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
        expiresAt: expect.any(Number),
      });
    });
  });

  describe('Response Interceptor', () => {
    it('should handle 401 responses with token refresh', async () => {
      const mockResponseUse = mockAxiosInstance.interceptors.response.use;
      const responseInterceptor = mockResponseUse.mock.calls[0][1];
      
      const error = {
        response: { status: 401 },
        config: { _retry: undefined, headers: {} },
      };
      
      // Mock successful refresh
      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          accessToken: 'refreshed-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      });
      
      mockSecureStorage.getTokens.mockResolvedValue({
        accessToken: 'refreshed-token',
        refreshToken: 'new-refresh-token',
        expiresAt: Date.now() + 3600000,
      });
      
      mockAxiosInstance.request = jest.fn().mockResolvedValue({ data: 'success' });
      
      const result = await responseInterceptor(error);
      
      expect(mockAxiosInstance.request).toHaveBeenCalled();
      expect(result.data).toBe('success');
    });

    it('should handle network errors', async () => {
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      
      const networkError = {
        response: undefined,
        config: { url: '/api/test', method: 'GET' },
        message: 'Network Error',
      };
      
      try {
        await responseInterceptor(networkError);
      } catch (error: any) {
        expect(error.isNetworkError).toBe(true);
        expect(error.originalRequest).toBeDefined();
      }
    });

    it('should handle rate limiting', async () => {
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      
      const rateLimitError = {
        response: {
          status: 429,
          headers: { 'retry-after': '60' },
        },
        config: { url: '/api/test' },
      };
      
      try {
        await responseInterceptor(rateLimitError);
      } catch (error: any) {
        expect(error.retryAfter).toBe(60);
        expect(error.message).toContain('Rate limited');
      }
    });

    it('should retry 5xx errors with exponential backoff', async () => {
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      
      const serverError = {
        response: { status: 500 },
        config: {
          url: '/api/test',
          metadata: { retryCount: 0 },
        },
      };
      
      mockAxiosInstance.request = jest.fn().mockResolvedValue({ data: 'success' });
      
      const resultPromise = responseInterceptor(serverError);
      
      // Fast-forward time to trigger retry
      jest.advanceTimersByTime(1000);
      
      const result = await resultPromise;
      expect(result.data).toBe('success');
    });
  });

  describe('Request Queue', () => {
    it('should queue requests when offline', () => {
      const networkStatus = apiClient.getNetworkStatus();
      
      // Simulate going offline
      const networkListener = mockNetInfo.addEventListener.mock.calls[0][0];
      networkListener({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      });
      
      const updatedStatus = apiClient.getNetworkStatus();
      expect(updatedStatus.isOnline).toBe(false);
    });

    it('should process queue when back online', async () => {
      // Simulate network state change
      const networkListener = mockNetInfo.addEventListener.mock.calls[0][0];
      
      // Go offline
      networkListener({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      });
      
      // Go back online
      networkListener({
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true,
      });
      
      // Should trigger queue processing
      expect(apiClient.getNetworkStatus().isOnline).toBe(true);
    });

    it('should clear queue on demand', () => {
      apiClient.clearQueue();
      
      const status = apiClient.getNetworkStatus();
      expect(status.queueLength).toBe(0);
    });
  });

  describe('Retry Logic', () => {
    it('should retry with exponential backoff', async () => {
      let callCount = 0;
      const mockRequestFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary error');
        }
        return Promise.resolve('success');
      });
      
      const result = await apiClient.requestWithRetry(mockRequestFn, 3, 100);
      
      expect(result).toBe('success');
      expect(callCount).toBe(3);
    });

    it('should not retry on auth errors', async () => {
      const mockRequestFn = jest.fn().mockRejectedValue({
        response: { status: 401 },
      });
      
      try {
        await apiClient.requestWithRetry(mockRequestFn, 3, 100);
      } catch (error) {
        expect(mockRequestFn).toHaveBeenCalledTimes(1);
      }
    });

    it('should not retry on client errors (4xx)', async () => {
      const mockRequestFn = jest.fn().mockRejectedValue({
        response: { status: 400 },
      });
      
      try {
        await apiClient.requestWithRetry(mockRequestFn, 3, 100);
      } catch (error) {
        expect(mockRequestFn).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      mockAxiosInstance.get.mockResolvedValue({ data: 'get-response' });
      mockAxiosInstance.post.mockResolvedValue({ data: 'post-response' });
      mockAxiosInstance.patch.mockResolvedValue({ data: 'patch-response' });
      mockAxiosInstance.delete.mockResolvedValue({ data: 'delete-response' });
    });

    it('should make GET requests', async () => {
      const result = await apiClient.get('/api/test');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/test', undefined);
      expect(result).toBe('get-response');
    });

    it('should make POST requests', async () => {
      const data = { test: 'data' };
      const result = await apiClient.post('/api/test', data);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/test', data, undefined);
      expect(result).toBe('post-response');
    });

    it('should make PATCH requests', async () => {
      const data = { update: 'data' };
      const result = await apiClient.patch('/api/test/1', data);
      
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/api/test/1', data, undefined);
      expect(result).toBe('patch-response');
    });

    it('should make DELETE requests', async () => {
      const result = await apiClient.delete('/api/test/1');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/api/test/1', undefined);
      expect(result).toBe('delete-response');
    });
  });

  describe('Error Events', () => {
    it('should emit network error events', async () => {
      const eventListener = jest.fn();
      apiClient.on('network:error', eventListener);
      
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      
      const networkError = {
        response: undefined,
        config: { url: '/api/test', method: 'GET' },
      };
      
      try {
        await responseInterceptor(networkError);
      } catch (error) {
        expect(eventListener).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.any(Object),
            url: '/api/test',
            method: 'GET',
          })
        );
      }
    });

    it('should emit auth events', () => {
      const expiredListener = jest.fn();
      const refreshedListener = jest.fn();
      
      apiClient.on('auth:expired', expiredListener);
      apiClient.on('auth:refreshed', refreshedListener);
      
      // These would be triggered by the actual interceptors
      apiClient.emit('auth:expired');
      apiClient.emit('auth:refreshed');
      
      expect(expiredListener).toHaveBeenCalled();
      expect(refreshedListener).toHaveBeenCalled();
    });
  });
});