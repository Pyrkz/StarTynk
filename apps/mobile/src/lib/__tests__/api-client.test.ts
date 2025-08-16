// TODO: Replace with @repo/shared after consolidation
// import { apiClient } from '../api-client';
// TODO: Replace with @repo/shared after consolidation
// import { tokenStorage } from '../storage/token-storage';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Mock dependencies
jest.mock('../storage/token-storage');
jest.mock('expo-device', () => ({
  isDevice: false,
  osBuildId: 'test-build-id',
}));
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({
    isConnected: true,
    type: 'WIFI',
  }),
}));

describe('API Client', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios = new MockAdapter(apiClient.getInstance());
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe('Authorization', () => {
    test('should add authorization header when token exists', async () => {
      const mockToken = 'test-token';
      (tokenStorage.getAccessToken as jest.Mock).mockResolvedValue(mockToken);

      mockAxios.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${mockToken}`);
        return [200, { data: 'success' }];
      });

      await apiClient.get('/test');
    });

    test('should not add authorization header when token does not exist', async () => {
      (tokenStorage.getAccessToken as jest.Mock).mockResolvedValue(null);

      mockAxios.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBeUndefined();
        return [200, { data: 'success' }];
      });

      await apiClient.get('/test');
    });
  });

  describe('Token Refresh', () => {
    test('should refresh token on 401', async () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';
      const refreshToken = 'refresh-token';

      (tokenStorage.getAccessToken as jest.Mock).mockResolvedValueOnce(oldToken);
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue(refreshToken);
      (tokenStorage.saveTokens as jest.Mock).mockResolvedValue(undefined);

      // First request fails with 401
      mockAxios.onGet('/test').replyOnce(401);

      // Refresh token request
      mockAxios.onPost('/auth/refresh').reply(200, {
        accessToken: newToken,
        refreshToken: refreshToken,
        expiresIn: 900,
      });

      // Retry original request with new token
      mockAxios.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${newToken}`);
        return [200, { data: { success: true } }];
      });

      const result = await apiClient.get('/test');
      expect(result).toEqual({ success: true });
      expect(tokenStorage.saveTokens).toHaveBeenCalled();
    });

    test('should clear tokens and throw error when refresh fails', async () => {
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';

      (tokenStorage.getAccessToken as jest.Mock).mockResolvedValueOnce(oldToken);
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue(refreshToken);
      (tokenStorage.clearTokens as jest.Mock).mockResolvedValue(undefined);

      // First request fails with 401
      mockAxios.onGet('/test').replyOnce(401);

      // Refresh token request fails
      mockAxios.onPost('/auth/refresh').reply(401);

      await expect(apiClient.get('/test')).rejects.toThrow('Session expired');
      expect(tokenStorage.clearTokens).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockAxios.onGet('/test').networkError();

      await expect(apiClient.get('/test')).rejects.toThrow('Network request failed');
    });

    test('should handle API errors with proper error structure', async () => {
      mockAxios.onGet('/test').reply(400, {
        error: {
          message: 'Bad request',
          code: 'INVALID_REQUEST',
          details: { field: 'email' },
        },
      });

      try {
        await apiClient.get('/test');
      } catch (error: any) {
        expect(error.message).toBe('Bad request');
        expect(error.code).toBe('INVALID_REQUEST');
        expect(error.status).toBe(400);
        expect(error.details).toEqual({ field: 'email' });
      }
    });
  });

  describe('Request Headers', () => {
    test('should include required headers in requests', async () => {
      mockAxios.onGet('/test').reply((config) => {
        expect(config.headers?.['Content-Type']).toBe('application/json');
        expect(config.headers?.['X-Client-Type']).toBe('mobile');
        expect(config.headers?.['X-App-Version']).toBeDefined();
        expect(config.headers?.['X-Platform']).toBeDefined();
        expect(config.headers?.['X-Device-Id']).toBeDefined();
        expect(config.headers?.['X-Network-Type']).toBe('WIFI');
        return [200, { data: 'success' }];
      });

      await apiClient.get('/test');
    });
  });

  describe('HTTP Methods', () => {
    test('GET request', async () => {
      mockAxios.onGet('/test', { params: { id: 1 } }).reply(200, { data: { id: 1 } });

      const result = await apiClient.get('/test', { params: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });

    test('POST request', async () => {
      const postData = { name: 'test' };
      mockAxios.onPost('/test', postData).reply(201, { data: { id: 1, ...postData } });

      const result = await apiClient.post('/test', postData);
      expect(result).toEqual({ id: 1, name: 'test' });
    });

    test('PUT request', async () => {
      const putData = { name: 'updated' };
      mockAxios.onPut('/test/1', putData).reply(200, { data: { id: 1, ...putData } });

      const result = await apiClient.put('/test/1', putData);
      expect(result).toEqual({ id: 1, name: 'updated' });
    });

    test('PATCH request', async () => {
      const patchData = { name: 'patched' };
      mockAxios.onPatch('/test/1', patchData).reply(200, { data: { id: 1, ...patchData } });

      const result = await apiClient.patch('/test/1', patchData);
      expect(result).toEqual({ id: 1, name: 'patched' });
    });

    test('DELETE request', async () => {
      mockAxios.onDelete('/test/1').reply(200, { data: { success: true } });

      const result = await apiClient.delete('/test/1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('File Upload', () => {
    test('should handle file upload with progress', async () => {
      const formData = new FormData();
      formData.append('file', 'test-file');

      const progressCallback = jest.fn();

      mockAxios.onPost('/upload').reply((config) => {
        expect(config.headers?.['Content-Type']).toBe('multipart/form-data');
        // Simulate progress
        if (config.onUploadProgress) {
          config.onUploadProgress({ loaded: 50, total: 100 } as any);
        }
        return [200, { data: { url: 'https://example.com/file' } }];
      });

      const result = await apiClient.upload('/upload', formData, progressCallback);
      expect(result).toEqual({ url: 'https://example.com/file' });
      expect(progressCallback).toHaveBeenCalledWith(50);
    });
  });
});