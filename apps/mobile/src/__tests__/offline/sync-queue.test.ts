import { syncQueue, SyncItem } from '../../lib/sync/sync-queue';
// TODO: Replace with @repo/shared after consolidation
// import { apiClient } from '../../lib/api/http-client';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('../../lib/api/http-client');
jest.mock('@react-native-community/netinfo');
jest.mock('../../lib/storage/secure-storage');
jest.mock('react-native-mmkv');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe('SyncQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock network as online by default
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      type: 'wifi',
      isInternetReachable: true,
    });
  });

  describe('Item Management', () => {
    it('should add items to queue when offline', async () => {
      // Mock offline state
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      });

      const item = {
        type: 'CREATE' as const,
        entity: 'attendance',
        payload: { checkIn: new Date() },
        timestamp: Date.now(),
        priority: 'high' as const,
      };

      const itemId = await syncQueue.add(item);
      expect(itemId).toMatch(/^sync_\d+_[a-z0-9]+$/);
      expect(syncQueue.getPendingCount()).toBe(1);
    });

    it('should auto-sync items when online', async () => {
      mockApiClient.post.mockResolvedValue({ id: 'server-id-123' });

      const item = {
        type: 'CREATE' as const,
        entity: 'attendance',
        payload: { checkIn: new Date() },
        timestamp: Date.now(),
        priority: 'high' as const,
      };

      await syncQueue.add(item);
      
      // Wait for auto-sync
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/attendance',
        expect.objectContaining({ checkIn: expect.any(Date) })
      );
    });

    it('should handle sync failures with retry', async () => {
      mockApiClient.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ id: 'server-id-123' });

      const item = {
        type: 'CREATE' as const,
        entity: 'attendance',
        payload: { checkIn: new Date() },
        timestamp: Date.now(),
        priority: 'high' as const,
      };

      await syncQueue.add(item);
      
      // Wait for retry
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts with CLIENT_WINS strategy', async () => {
      const serverData = { 
        id: 'task-1', 
        status: 'completed', 
        updatedAt: new Date(Date.now() - 1000).toISOString() 
      };
      const clientData = { 
        status: 'in_progress', 
        notes: 'Client notes' 
      };

      mockApiClient.get.mockResolvedValue(serverData);
      mockApiClient.patch.mockResolvedValue({ ...serverData, ...clientData });

      const item = {
        type: 'UPDATE' as const,
        entity: 'tasks',
        entityId: 'task-1',
        payload: clientData,
        timestamp: Date.now(),
        priority: 'medium' as const,
        conflictResolution: 'CLIENT_WINS' as const,
      };

      await syncQueue.add(item);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/api/tasks/task-1',
        clientData
      );
    });

    it('should merge data for MERGE strategy', async () => {
      const serverData = { 
        id: 'task-1', 
        status: 'completed', 
        notes: 'Server notes',
        updatedAt: new Date(Date.now() + 1000).toISOString() // Server is newer
      };
      const clientData = { 
        status: 'in_progress', 
        notes: 'Client notes' 
      };

      mockApiClient.get.mockResolvedValue(serverData);
      mockApiClient.patch.mockResolvedValue({});

      const item = {
        type: 'UPDATE' as const,
        entity: 'tasks',
        entityId: 'task-1',
        payload: clientData,
        timestamp: Date.now() - 2000, // Client data is older
        priority: 'medium' as const,
        conflictResolution: 'MERGE' as const,
      };

      await syncQueue.add(item);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should merge notes
      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/api/tasks/task-1',
        expect.objectContaining({
          notes: 'Server notes\n---\nClient notes'
        })
      );
    });

    it('should convert UPDATE to CREATE when entity not found', async () => {
      mockApiClient.get.mockRejectedValue({
        response: { status: 404 }
      });
      mockApiClient.post.mockResolvedValue({ id: 'new-id' });

      const item = {
        type: 'UPDATE' as const,
        entity: 'tasks',
        entityId: 'non-existent-id',
        payload: { status: 'in_progress' },
        timestamp: Date.now(),
        priority: 'medium' as const,
      };

      await syncQueue.add(item);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/tasks',
        { status: 'in_progress' }
      );
    });
  });

  describe('Priority Handling', () => {
    it('should process high priority items first', async () => {
      const callOrder: string[] = [];
      
      mockApiClient.post.mockImplementation((url, data) => {
        callOrder.push(data.priority);
        return Promise.resolve({ id: 'test' });
      });

      // Add items in reverse priority order
      await syncQueue.add({
        type: 'CREATE',
        entity: 'test',
        payload: { priority: 'low' },
        timestamp: Date.now(),
        priority: 'low',
      });

      await syncQueue.add({
        type: 'CREATE',
        entity: 'test',
        payload: { priority: 'high' },
        timestamp: Date.now(),
        priority: 'high',
      });

      await syncQueue.add({
        type: 'CREATE',
        entity: 'test',
        payload: { priority: 'medium' },
        timestamp: Date.now(),
        priority: 'medium',
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      // High priority should be processed first
      expect(callOrder[0]).toBe('high');
      expect(callOrder[1]).toBe('medium');
      expect(callOrder[2]).toBe('low');
    });
  });

  describe('Network State Changes', () => {
    it('should start sync when coming back online', async () => {
      let networkListener: ((state: any) => void) | null = null;
      
      mockNetInfo.addEventListener.mockImplementation((listener) => {
        networkListener = listener;
        return () => {};
      });

      // Start offline
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      });

      // Add item while offline
      await syncQueue.add({
        type: 'CREATE',
        entity: 'attendance',
        payload: { checkIn: new Date() },
        timestamp: Date.now(),
        priority: 'high',
      });

      expect(syncQueue.getPendingCount()).toBe(1);
      expect(mockApiClient.post).not.toHaveBeenCalled();

      // Simulate coming back online
      mockApiClient.post.mockResolvedValue({ id: 'server-id' });
      
      if (networkListener) {
        networkListener({
          isConnected: true,
          type: 'wifi',
          isInternetReachable: true,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for sync

      expect(mockApiClient.post).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should mark items as failed after max retries', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Persistent error'));

      const item = {
        type: 'CREATE' as const,
        entity: 'attendance',
        payload: { checkIn: new Date() },
        timestamp: Date.now(),
        priority: 'high' as const,
      };

      await syncQueue.add(item);
      
      // Wait for all retries to complete
      await new Promise(resolve => setTimeout(resolve, 10000));

      expect(syncQueue.getFailedItems().length).toBe(1);
      expect(mockApiClient.post).toHaveBeenCalledTimes(6); // Initial + 5 retries
    });

    it('should not retry client errors (4xx)', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 400 },
        message: 'Bad request'
      });

      const item = {
        type: 'CREATE' as const,
        entity: 'attendance',
        payload: { invalid: 'data' },
        timestamp: Date.now(),
        priority: 'high' as const,
      };

      await syncQueue.add(item);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockApiClient.post).toHaveBeenCalledTimes(1); // No retries
    });

    it('should retry server errors (5xx)', async () => {
      mockApiClient.post
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValueOnce({ id: 'success' });

      const item = {
        type: 'CREATE' as const,
        entity: 'attendance',
        payload: { checkIn: new Date() },
        timestamp: Date.now(),
        priority: 'high' as const,
      };

      await syncQueue.add(item);
      await new Promise(resolve => setTimeout(resolve, 5000));

      expect(mockApiClient.post).toHaveBeenCalledTimes(3);
    });
  });

  describe('Statistics', () => {
    it('should track sync statistics', async () => {
      mockApiClient.post.mockResolvedValue({ id: 'test' });

      // Add and sync multiple items
      await Promise.all([
        syncQueue.add({
          type: 'CREATE',
          entity: 'test1',
          payload: {},
          timestamp: Date.now(),
          priority: 'medium',
        }),
        syncQueue.add({
          type: 'CREATE',
          entity: 'test2',
          payload: {},
          timestamp: Date.now(),
          priority: 'medium',
        }),
      ]);

      await new Promise(resolve => setTimeout(resolve, 200));

      const stats = syncQueue.getStats();
      expect(stats.totalSynced).toBe(2);
      expect(stats.pendingCount).toBe(0);
      expect(stats.lastSyncAttempt).toBeGreaterThan(0);
    });
  });

  describe('Public API', () => {
    it('should retry failed items', async () => {
      mockApiClient.post
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({ id: 'success' });

      const item = {
        type: 'CREATE' as const,
        entity: 'attendance',
        payload: { checkIn: new Date() },
        timestamp: Date.now(),
        priority: 'high' as const,
      };

      const itemId = await syncQueue.add(item);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have failed once
      expect(syncQueue.getFailedItems().length).toBe(0); // Still retrying
      expect(syncQueue.getPendingCount()).toBe(1);

      // Force retry
      syncQueue.retry(itemId);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
    });

    it('should force sync all pending items', async () => {
      mockApiClient.post.mockResolvedValue({ id: 'test' });

      // Add items
      await Promise.all([
        syncQueue.add({
          type: 'CREATE',
          entity: 'test1',
          payload: {},
          timestamp: Date.now(),
          priority: 'low',
        }),
        syncQueue.add({
          type: 'CREATE',
          entity: 'test2',
          payload: {},
          timestamp: Date.now(),
          priority: 'low',
        }),
      ]);

      await syncQueue.forceSync();

      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
    });
  });
});