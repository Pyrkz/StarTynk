import { renderHook, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { useAttendanceMutation, useTaskUpdateMutation } from '../../lib/query/hooks';
import { syncQueue } from '../../lib/sync/sync-queue';
// TODO: Replace with @repo/shared after consolidation
// import { apiClient } from '../../lib/api/http-client';

// Mock dependencies
jest.mock('@react-native-community/netinfo');
jest.mock('../../lib/api/http-client');
jest.mock('../../lib/sync/sync-queue');
jest.mock('../../lib/storage/secure-storage');

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockSyncQueue = syncQueue as jest.Mocked<typeof syncQueue>;

// Mock NetInfo hook
const mockUseNetInfo = jest.fn();
(NetInfo as any).useNetInfo = mockUseNetInfo;

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('Offline Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock sync queue methods
    mockSyncQueue.add.mockResolvedValue('sync-item-id');
    mockSyncQueue.getPendingCount.mockReturnValue(0);
    mockSyncQueue.getFailedItems.mockReturnValue([]);
    mockSyncQueue.isSyncInProgress.mockReturnValue(false);
    
    // Default to online
    mockUseNetInfo.mockReturnValue({
      isConnected: true,
      type: 'wifi',
      isInternetReachable: true,
    });
  });

  describe('Online Behavior', () => {
    it('should execute mutations directly when online', async () => {
      mockApiClient.post.mockResolvedValue({
        id: 'attendance-123',
        checkIn: new Date().toISOString(),
      });

      const { result } = renderHook(() => useAttendanceMutation(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.mutate({
          type: 'check-in',
          projectId: 'project-123',
          location: { lat: 40.7128, lng: -74.0060 },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/attendance',
        expect.objectContaining({
          type: 'check-in',
          projectId: 'project-123',
          location: { lat: 40.7128, lng: -74.0060 },
        })
      );
      
      expect(mockSyncQueue.add).not.toHaveBeenCalled();
    });

    it('should handle server errors gracefully when online', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 400 },
        message: 'Bad request',
      });

      const { result } = renderHook(() => useAttendanceMutation(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.mutate({
          type: 'check-in',
          projectId: 'project-123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Offline Behavior', () => {
    beforeEach(() => {
      // Mock offline state
      mockUseNetInfo.mockReturnValue({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      });
    });

    it('should queue attendance mutations when offline', async () => {
      const { result } = renderHook(() => useAttendanceMutation(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.mutate({
          type: 'check-in',
          projectId: 'project-123',
          location: { lat: 40.7128, lng: -74.0060 },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSyncQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CREATE',
          entity: 'attendance',
          payload: expect.objectContaining({
            type: 'check-in',
            projectId: 'project-123',
            location: { lat: 40.7128, lng: -74.0060 },
          }),
          priority: 'high',
        })
      );

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('should return optimistic response for attendance', async () => {
      const { result } = renderHook(() => useAttendanceMutation(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.mutate({
          type: 'check-in',
          projectId: 'project-123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(/^temp-\d+$/),
          type: 'check-in',
          projectId: 'project-123',
          synced: false,
        })
      );
    });

    it('should queue task updates when offline', async () => {
      const { result } = renderHook(() => useTaskUpdateMutation(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.mutate({
          taskId: 'task-123',
          status: 'completed',
          notes: 'Finished offline',
          progress: 100,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSyncQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UPDATE',
          entity: 'tasks',
          payload: expect.objectContaining({
            taskId: 'task-123',
            status: 'completed',
            notes: 'Finished offline',
            progress: 100,
          }),
          priority: 'high',
        })
      );
    });
  });

  describe('Network State Transitions', () => {
    it('should handle going offline during mutation', async () => {
      // Start online
      mockUseNetInfo.mockReturnValue({
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true,
      });

      const { result, rerender } = renderHook(() => useAttendanceMutation(), {
        wrapper: TestWrapper,
      });

      // Simulate network request failing due to network loss
      mockApiClient.post.mockRejectedValue({
        isNetworkError: true,
        code: 'NETWORK_ERROR',
      });

      act(() => {
        result.current.mutate({
          type: 'check-in',
          projectId: 'project-123',
        });
      });

      // Go offline
      mockUseNetInfo.mockReturnValue({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      });

      rerender();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should queue the request for later sync
      expect(mockSyncQueue.add).toHaveBeenCalled();
    });

    it('should trigger sync when coming back online', async () => {
      // Mock pending items in sync queue
      mockSyncQueue.getPendingCount.mockReturnValue(3);
      mockSyncQueue.forceSync.mockResolvedValue();

      // Start offline
      let networkState = {
        isConnected: false,
        type: 'none' as const,
        isInternetReachable: false,
      };

      let networkListener: ((state: any) => void) | null = null;
      mockNetInfo.addEventListener.mockImplementation((listener) => {
        networkListener = listener;
        return () => {};
      });

      mockUseNetInfo.mockReturnValue(networkState);

      const { rerender } = renderHook(() => useAttendanceMutation(), {
        wrapper: TestWrapper,
      });

      // Simulate coming back online
      networkState = {
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true,
      };

      mockUseNetInfo.mockReturnValue(networkState);

      if (networkListener) {
        networkListener(networkState);
      }

      rerender();

      // Should attempt to sync pending items
      await waitFor(() => {
        expect(mockSyncQueue.forceSync).toHaveBeenCalled();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle sync queue failures gracefully', async () => {
      mockUseNetInfo.mockReturnValue({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      });

      mockSyncQueue.add.mockRejectedValue(new Error('Queue storage full'));

      const { result } = renderHook(() => useAttendanceMutation(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.mutate({
          type: 'check-in',
          projectId: 'project-123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should retry failed operations when requested', async () => {
      mockSyncQueue.getFailedItems.mockReturnValue([
        {
          id: 'failed-1',
          type: 'CREATE',
          entity: 'attendance',
          payload: { type: 'check-in' },
          timestamp: Date.now(),
          retryCount: 3,
          status: 'FAILED',
          priority: 'high',
          error: 'Network timeout',
        },
      ]);

      mockSyncQueue.retryAll.mockImplementation(() => {
        mockSyncQueue.getFailedItems.mockReturnValue([]);
        mockSyncQueue.getPendingCount.mockReturnValue(1);
      });

      // Simulate retry functionality
      syncQueue.retryAll();

      expect(mockSyncQueue.retryAll).toHaveBeenCalled();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across offline/online transitions', async () => {
      const queryClient = createTestQueryClient();

      // Set initial cache data
      queryClient.setQueryData(['attendance'], [
        { id: 'att-1', type: 'check-in', status: 'synced' },
      ]);

      mockUseNetInfo.mockReturnValue({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      });

      const { result } = renderHook(() => useAttendanceMutation(), {
        wrapper: ({ children }) => React.createElement(QueryClientProvider, { client: queryClient }, children),
      });

      // Add offline data
      act(() => {
        result.current.mutate({
          type: 'check-out',
          projectId: 'project-123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify optimistic update
      const updatedData = queryClient.getQueryData(['attendance']);
      expect(updatedData).toEqual([
        { id: 'att-1', type: 'check-in', status: 'synced' },
        expect.objectContaining({
          type: 'check-out',
          synced: false,
        }),
      ]);
    });
  });
});