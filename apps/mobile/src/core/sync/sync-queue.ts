import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';
import { EventEmitter } from 'events';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { createMobileAPIClient } from '@repo/api/mobile';
import { createMobileAuthService } from '@repo/auth';
import { secureStorage } from '../storage/secure-storage';

export interface SyncItem {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId?: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'SUCCESS' | 'FAILED';
  error?: string;
  priority: 'high' | 'medium' | 'low';
  conflictResolution?: 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGE';
  originalTimestamp?: number;
  userId?: string;
  deviceId?: string;
}

interface ConflictData {
  hasConflict: boolean;
  serverData?: any;
  clientData?: any;
  resolution: 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGE';
  mergedData?: any;
}

interface SyncStats {
  totalSynced: number;
  totalFailed: number;
  lastSyncAttempt: number;
  averageSyncTime: number;
}

class SyncQueue extends EventEmitter {
  private storage: MMKV;
  private queue: Map<string, SyncItem> = new Map();
  private isSyncing = false;
  private syncInterval: number | null = null;
  private stats: SyncStats = {
    totalSynced: 0,
    totalFailed: 0,
    lastSyncAttempt: 0,
    averageSyncTime: 0,
  };
  private isOnline = true;
  private maxRetries = 5;
  private syncBatchSize = 10;
  
  constructor() {
    super();
    this.storage = new MMKV({ id: 'sync-queue' });
    this.loadQueue();
    this.loadStats();
    this.setupNetworkListener();
    this.setupBackgroundSync();
    this.startPeriodicSync();
  }

  private async getApiClient() {
    return await createMobileAPIClient(
      process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
      createMobileAuthService()
    );
  }
  
  /**
   * Add item to sync queue
   */
  async add(item: Omit<SyncItem, 'id' | 'retryCount' | 'status' | 'deviceId' | 'userId'>): Promise<string> {
    try {
      const deviceInfo = await secureStorage.getDeviceInfo();
      const userData = await secureStorage.getUserData();
      
      const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const syncItem: SyncItem = {
        ...item,
        id,
        retryCount: 0,
        status: 'PENDING',
        deviceId: deviceInfo.id,
        userId: userData?.id,
        originalTimestamp: item.timestamp,
      };
      
      this.queue.set(id, syncItem);
      this.saveQueue();
      
      this.emit('item:added', syncItem);
      
      // Try immediate sync if online
      if (this.isOnline && !this.isSyncing) {
        setImmediate(() => this.startSync());
      }
      
      return id;
    } catch (error) {
      console.error('Failed to add sync item:', error);
      throw error;
    }
  }
  
  /**
   * Start sync process
   */
  private async startSync(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;
    
    const pendingItems = Array.from(this.queue.values())
      .filter(item => item.status === 'PENDING')
      .sort((a, b) => {
        // Sort by priority and timestamp
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });
    
    if (pendingItems.length === 0) return;
    
    this.isSyncing = true;
    this.stats.lastSyncAttempt = Date.now();
    const syncStartTime = Date.now();
    
    this.emit('sync:start', { itemCount: pendingItems.length });
    
    // Process items in batches
    const batches = this.chunkArray(pendingItems, this.syncBatchSize);
    let syncedCount = 0;
    let failedCount = 0;
    
    for (const batch of batches) {
      const batchPromises = batch.map(item => this.syncItem(item));
      const results = await Promise.allSettled(batchPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          syncedCount++;
        } else {
          failedCount++;
          console.error(`Failed to sync item ${batch[index].id}:`, result.reason);
        }
      });
      
      // Small delay between batches to prevent overwhelming server
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const syncDuration = Date.now() - syncStartTime;
    this.updateStats(syncedCount, failedCount, syncDuration);
    
    this.isSyncing = false;
    this.emit('sync:complete', { 
      synced: syncedCount, 
      failed: failedCount, 
      duration: syncDuration 
    });
  }
  
  /**
   * Sync individual item
   */
  private async syncItem(item: SyncItem): Promise<void> {
    try {
      item.status = 'SYNCING';
      this.emit('item:syncing', item);
      
      // Check for conflicts before syncing
      const conflictData = await this.checkConflicts(item);
      if (conflictData.hasConflict) {
        item = await this.resolveConflict(item, conflictData);
        
        // If conflict resolution indicates skip, mark as success
        if (item.status === 'SUCCESS') {
          this.queue.delete(item.id);
          this.saveQueue();
          this.emit('item:synced', item);
          return;
        }
      }
      
      // Perform sync based on operation type
      let result: any;
      const endpoint = this.getEndpoint(item.entity, item.entityId);
      const apiClient = await this.getApiClient();
      
      switch (item.type) {
        case 'CREATE':
          result = await apiClient.post(endpoint, item.payload);
          // Update local ID mapping if server returns new ID
          if (result.id && result.id !== item.entityId) {
            this.updateIdMapping(item, result.id);
          }
          break;
          
        case 'UPDATE':
          if (!item.entityId) {
            throw new Error('Entity ID required for UPDATE operation');
          }
          result = await apiClient.put(`${endpoint}/${item.entityId}`, item.payload);
          break;
          
        case 'DELETE':
          if (!item.entityId) {
            throw new Error('Entity ID required for DELETE operation');
          }
          result = await apiClient.delete(`${endpoint}/${item.entityId}`);
          break;
          
        default:
          throw new Error(`Unknown sync operation: ${item.type}`);
      }
      
      // Success - remove from queue
      item.status = 'SUCCESS';
      this.queue.delete(item.id);
      this.saveQueue();
      
      this.emit('item:synced', { ...item, result });
      
    } catch (error: any) {
      item.retryCount++;
      
      if (item.retryCount >= this.maxRetries) {
        item.status = 'FAILED';
        item.error = error.message;
        this.emit('item:failed', item);
      } else {
        item.status = 'PENDING';
        
        // Exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, item.retryCount), 30000);
        setTimeout(() => {
          if (this.isOnline && !this.isSyncing) {
            this.startSync();
          }
        }, delay);
      }
      
      this.saveQueue();
      
      if (item.status === 'FAILED') {
        this.emit('item:failed', item);
      }
    }
  }
  
  /**
   * Check for conflicts with server data
   */
  private async checkConflicts(item: SyncItem): Promise<ConflictData> {
    if (item.type === 'CREATE') {
      // No conflicts for create operations
      return { hasConflict: false, resolution: 'CLIENT_WINS' };
    }
    
    if (!item.entityId) {
      return { hasConflict: false, resolution: 'CLIENT_WINS' };
    }
    
    try {
      const endpoint = this.getEndpoint(item.entity, item.entityId);
      const apiClient = await this.getApiClient();
      const serverData = await apiClient.get(`${endpoint}/${item.entityId}`);
      
      // Compare timestamps to detect conflicts
      const serverTimestamp = new Date((serverData as any).updatedAt || (serverData as any).createdAt).getTime();
      const clientTimestamp = item.originalTimestamp || item.timestamp;
      
      if (serverTimestamp > clientTimestamp) {
        // Server data is newer - potential conflict
        const resolution = item.conflictResolution || this.getDefaultResolution(item.entity);
        
        return {
          hasConflict: true,
          serverData,
          clientData: item.payload,
          resolution,
        };
      }
      
      return { hasConflict: false, resolution: 'CLIENT_WINS' };
      
    } catch (error: any) {
      // If entity doesn't exist on server and this is an UPDATE, convert to CREATE
      if (error.response?.status === 404 && item.type === 'UPDATE') {
        item.type = 'CREATE';
        item.entityId = undefined;
      }
      
      return { hasConflict: false, resolution: 'CLIENT_WINS' };
    }
  }
  
  /**
   * Resolve conflicts based on strategy
   */
  private async resolveConflict(item: SyncItem, conflict: ConflictData): Promise<SyncItem> {
    const { resolution, serverData, clientData } = conflict;
    
    switch (resolution) {
      case 'CLIENT_WINS':
        // Keep client changes, overwrite server
        this.emit('conflict:resolved', {
          type: 'CLIENT_WINS',
          item,
          serverData,
          clientData,
        });
        return item;
        
      case 'SERVER_WINS':
        // Discard client changes, keep server data
        item.status = 'SUCCESS'; // Mark as synced (no action needed)
        this.emit('conflict:resolved', {
          type: 'SERVER_WINS',
          item,
          serverData,
          clientData,
        });
        return item;
        
      case 'MERGE':
        // Merge client and server data
        const mergedData = this.mergeData(clientData, serverData, item.entity);
        item.payload = mergedData;
        
        this.emit('conflict:resolved', {
          type: 'MERGE',
          item,
          serverData,
          clientData,
          mergedData,
        });
        return item;
        
      default:
        return item;
    }
  }
  
  /**
   * Merge client and server data based on entity type
   */
  private mergeData(clientData: any, serverData: any, entityType: string): any {
    switch (entityType) {
      case 'attendance':
        // For attendance, prefer client check-in/out times but keep server metadata
        return {
          ...serverData,
          ...clientData,
          checkIn: clientData.checkIn || serverData.checkIn,
          checkOut: clientData.checkOut || serverData.checkOut,
          notes: this.mergeNotes(clientData.notes, serverData.notes),
        };
        
      case 'tasks':
        // For tasks, merge status updates and notes
        return {
          ...serverData,
          ...clientData,
          status: clientData.status || serverData.status,
          progress: Math.max(clientData.progress || 0, serverData.progress || 0),
          notes: this.mergeNotes(clientData.notes, serverData.notes),
        };
        
      case 'material-requests':
        // For material requests, merge quantities
        return {
          ...serverData,
          ...clientData,
          materials: this.mergeMaterials(clientData.materials, serverData.materials),
        };
        
      default:
        // Default merge strategy: client data overwrites server data
        return {
          ...serverData,
          ...clientData,
          updatedAt: new Date().toISOString(),
        };
    }
  }
  
  /**
   * Merge notes with separator
   */
  private mergeNotes(clientNotes?: string, serverNotes?: string): string {
    if (!clientNotes && !serverNotes) return '';
    if (!clientNotes) return serverNotes || '';
    if (!serverNotes) return clientNotes;
    
    if (clientNotes === serverNotes) return clientNotes;
    
    return `${serverNotes}\n---\n${clientNotes}`;
  }
  
  /**
   * Merge material arrays
   */
  private mergeMaterials(clientMaterials: any[], serverMaterials: any[]): any[] {
    const merged = [...serverMaterials];
    
    clientMaterials.forEach(clientMaterial => {
      const existingIndex = merged.findIndex(m => m.materialId === clientMaterial.materialId);
      if (existingIndex >= 0) {
        // Merge quantities
        merged[existingIndex].quantity = Math.max(
          merged[existingIndex].quantity,
          clientMaterial.quantity
        );
      } else {
        merged.push(clientMaterial);
      }
    });
    
    return merged;
  }
  
  /**
   * Get default conflict resolution strategy for entity type
   */
  private getDefaultResolution(entityType: string): 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGE' {
    switch (entityType) {
      case 'attendance':
      case 'tasks':
        return 'MERGE';
      case 'material-requests':
        return 'CLIENT_WINS';
      default:
        return 'CLIENT_WINS';
    }
  }
  
  /**
   * Get API endpoint for entity type
   */
  private getEndpoint(entity: string, entityId?: string): string {
    const endpoints: Record<string, string> = {
      attendance: '/api/attendance',
      tasks: '/api/tasks',
      'material-requests': '/api/material-requests',
      projects: '/api/projects',
      users: '/api/users',
    };
    
    return endpoints[entity] || `/api/${entity}`;
  }
  
  /**
   * Update ID mapping for created entities
   */
  private updateIdMapping(item: SyncItem, serverId: string): void {
    // Store ID mapping for future reference
    const idMapping = this.storage.getString('id-mappings') || '{}';
    const mappings = JSON.parse(idMapping);
    
    const tempId = item.entityId || `temp-${item.timestamp}`;
    mappings[tempId] = serverId;
    
    this.storage.set('id-mappings', JSON.stringify(mappings));
    
    this.emit('id:mapped', { tempId, serverId, entity: item.entity });
  }
  
  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline) {
        // Back online - start sync
        setTimeout(() => this.startSync(), 1000);
      }
    });
  }
  
  /**
   * Setup background sync task
   */
  private setupBackgroundSync(): void {
    const BACKGROUND_SYNC_TASK = 'background-sync';
    
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      try {
        await this.startSync();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Background sync failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
    
    BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    }).catch(error => {
      console.error('Failed to register background sync:', error);
    });
  }
  
  /**
   * Start periodic sync timer
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.getPendingCount() > 0) {
        this.startSync();
      }
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Update sync statistics
   */
  private updateStats(syncedCount: number, failedCount: number, duration: number): void {
    this.stats.totalSynced += syncedCount;
    this.stats.totalFailed += failedCount;
    
    // Update average sync time
    const totalSyncs = this.stats.totalSynced + this.stats.totalFailed;
    if (totalSyncs > 0) {
      this.stats.averageSyncTime = (this.stats.averageSyncTime * (totalSyncs - syncedCount - failedCount) + duration) / totalSyncs;
    }
    
    this.saveStats();
  }
  
  /**
   * Load queue from storage
   */
  private loadQueue(): void {
    try {
      const data = this.storage.getString('queue');
      if (data) {
        const items: SyncItem[] = JSON.parse(data);
        items.forEach(item => {
          // Reset syncing items to pending on app restart
          if (item.status === 'SYNCING') {
            item.status = 'PENDING';
          }
          this.queue.set(item.id, item);
        });
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }
  
  /**
   * Save queue to storage
   */
  private saveQueue(): void {
    try {
      const items = Array.from(this.queue.values());
      this.storage.set('queue', JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }
  
  /**
   * Load statistics from storage
   */
  private loadStats(): void {
    try {
      const data = this.storage.getString('stats');
      if (data) {
        this.stats = { ...this.stats, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load sync stats:', error);
    }
  }
  
  /**
   * Save statistics to storage
   */
  private saveStats(): void {
    try {
      this.storage.set('stats', JSON.stringify(this.stats));
    } catch (error) {
      console.error('Failed to save sync stats:', error);
    }
  }
  
  // Public API methods
  
  /**
   * Get pending items count
   */
  getPendingCount(): number {
    return Array.from(this.queue.values())
      .filter(item => item.status === 'PENDING').length;
  }
  
  /**
   * Get failed items
   */
  getFailedItems(): SyncItem[] {
    return Array.from(this.queue.values())
      .filter(item => item.status === 'FAILED');
  }

  /**
   * Get all pending items
   */
  getPendingItems(): SyncItem[] {
    return Array.from(this.queue.values())
      .filter(item => item.status === 'PENDING');
  }

  /**
   * Process a single sync item
   */
  async processItem(item: SyncItem): Promise<void> {
    try {
      item.status = 'SYNCING';
      await this.syncItem(item);
    } catch (error) {
      console.error(`Failed to process item ${item.id}:`, error);
      throw error;
    }
  }

  /**
   * Clean old completed items
   */
  cleanOldItems(): void {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    
    this.queue.forEach((item, id) => {
      if (item.status === 'SUCCESS' && item.timestamp < cutoffTime) {
        this.queue.delete(id);
      }
    });
    
    this.saveQueue();
  }
  
  /**
   * Get sync statistics
   */
  getStats(): SyncStats & { pendingCount: number; failedCount: number } {
    return {
      ...this.stats,
      pendingCount: this.getPendingCount(),
      failedCount: this.getFailedItems().length,
    };
  }
  
  /**
   * Retry failed item
   */
  retry(id: string): void {
    const item = this.queue.get(id);
    if (item && item.status === 'FAILED') {
      item.status = 'PENDING';
      item.retryCount = 0;
      item.error = undefined;
      this.saveQueue();
      
      if (this.isOnline && !this.isSyncing) {
        this.startSync();
      }
    }
  }
  
  /**
   * Retry all failed items
   */
  retryAll(): void {
    const failedItems = this.getFailedItems();
    failedItems.forEach(item => {
      item.status = 'PENDING';
      item.retryCount = 0;
      item.error = undefined;
    });
    
    if (failedItems.length > 0) {
      this.saveQueue();
      if (this.isOnline && !this.isSyncing) {
        this.startSync();
      }
    }
  }
  
  /**
   * Clear all completed items
   */
  clearCompleted(): void {
    const completedIds: string[] = [];
    this.queue.forEach((item, id) => {
      if (item.status === 'SUCCESS') {
        completedIds.push(id);
      }
    });
    
    completedIds.forEach(id => this.queue.delete(id));
    if (completedIds.length > 0) {
      this.saveQueue();
    }
  }
  
  /**
   * Clear all items (use with caution)
   */
  clear(): void {
    this.queue.clear();
    this.storage.delete('queue');
    this.emit('queue:cleared');
  }
  
  /**
   * Force sync now
   */
  forceSync(): Promise<void> {
    if (!this.isOnline) {
      return Promise.reject(new Error('Cannot sync while offline'));
    }
    
    return this.startSync();
  }
  
  /**
   * Get last sync attempt timestamp
   */
  getLastSyncAttempt(): number {
    return this.stats.lastSyncAttempt;
  }
  
  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

// Export singleton instance
export const syncQueue = new SyncQueue();