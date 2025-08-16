import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncQueue } from './sync-queue';
import { dataSync } from './data-sync';
import { trpc } from '../trpc';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';
const BACKGROUND_FETCH_INTERVAL = 15 * 60; // 15 minutes

export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager;
  private isRegistered = false;
  
  private constructor() {}
  
  static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager();
    }
    return BackgroundSyncManager.instance;
  }
  
  async initialize(): Promise<void> {
    // Define the background task
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      try {
        const startTime = Date.now();
        
        // Check network connectivity
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
        
        // Perform sync operations
        const results = await Promise.allSettled([
          this.syncPendingData(),
          this.fetchLatestData(),
          this.cleanupOldData(),
        ]);
        
        const duration = Date.now() - startTime;
        
        // Log sync results
        await this.logSyncResults(results, duration);
        
        // Determine result based on success
        const hasNewData = results.some(
          r => r.status === 'fulfilled' && r.value?.hasNewData
        );
        
        return hasNewData
          ? BackgroundFetch.BackgroundFetchResult.NewData
          : BackgroundFetch.BackgroundFetchResult.NoData;
          
      } catch (error) {
        console.error('Background sync failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
    
    // Register background fetch
    await this.registerBackgroundFetch();
  }
  
  private async registerBackgroundFetch(): Promise<void> {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: BACKGROUND_FETCH_INTERVAL,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      
      this.isRegistered = true;
      console.log('Background sync registered successfully');
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }
  
  private async syncPendingData(): Promise<{ hasNewData: boolean }> {
    const pendingItems = await syncQueue.getPendingItems();
    if (pendingItems.length === 0) {
      return { hasNewData: false };
    }
    
    let syncedCount = 0;
    
    for (const item of pendingItems) {
      try {
        await syncQueue.processItem(item);
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
      }
    }
    
    return { hasNewData: syncedCount > 0 };
  }
  
  private async fetchLatestData(): Promise<{ hasNewData: boolean }> {
    try {
      // Get last sync timestamp
      const lastSync = await AsyncStorage.getItem('last_sync_timestamp');
      const since = lastSync ? new Date(lastSync) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Fetch updates from server
      const updates = await trpc.sync.getUpdates.query({
        since,
        entities: ['projects', 'tasks', 'attendance'],
      });
      
      if (updates.data && Object.keys(updates.data).length > 0) {
        // Apply updates to local cache
        await dataSync.applyServerUpdates(updates.data);
        
        // Update last sync timestamp
        await AsyncStorage.setItem('last_sync_timestamp', new Date().toISOString());
        
        return { hasNewData: true };
      }
      
      return { hasNewData: false };
    } catch (error) {
      console.error('Failed to fetch latest data:', error);
      return { hasNewData: false };
    }
  }
  
  private async cleanupOldData(): Promise<void> {
    const ONE_MONTH_AGO = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    // Clean old sync logs
    await syncQueue.cleanOldItems(ONE_MONTH_AGO);
    
    // Clean old cache entries
    const cacheKeys = await AsyncStorage.getAllKeys();
    for (const key of cacheKeys) {
      if (key.startsWith('cache:')) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.timestamp < ONE_MONTH_AGO) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    }
  }
  
  private async logSyncResults(results: PromiseSettledResult<any>[], duration: number): Promise<void> {
    const syncLog = {
      timestamp: new Date().toISOString(),
      duration,
      results: results.map((r, i) => ({
        task: ['syncPending', 'fetchLatest', 'cleanup'][i],
        status: r.status,
        value: r.status === 'fulfilled' ? r.value : undefined,
        reason: r.status === 'rejected' ? r.reason?.message : undefined,
      })),
    };
    
    await AsyncStorage.setItem(
      'last_background_sync',
      JSON.stringify(syncLog)
    );
  }
  
  async unregister(): Promise<void> {
    if (this.isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      this.isRegistered = false;
    }
  }
  
  async getStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
    return await BackgroundFetch.getStatusAsync();
  }
  
  async getLastSyncLog(): Promise<any> {
    const log = await AsyncStorage.getItem('last_background_sync');
    return log ? JSON.parse(log) : null;
  }
  
  async isRegistered(): Promise<boolean> {
    const registeredTasks = await TaskManager.getRegisteredTasksAsync();
    return registeredTasks.some(task => task.taskName === BACKGROUND_SYNC_TASK);
  }
}

export const backgroundSync = BackgroundSyncManager.getInstance();