import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient } from '../trpc';

export interface ServerUpdate {
  entityType: string;
  entityId: string;
  data: any;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  timestamp: string;
}

export interface SyncMetadata {
  lastSyncTimestamp: string;
  entityVersions: Record<string, Record<string, number>>; // entityType -> entityId -> version
  conflictCount: number;
  successCount: number;
}

export class DataSync {
  private static instance: DataSync;
  private metadata: SyncMetadata;
  
  private constructor() {
    this.metadata = {
      lastSyncTimestamp: new Date().toISOString(),
      entityVersions: {},
      conflictCount: 0,
      successCount: 0,
    };
    this.loadMetadata();
  }
  
  static getInstance(): DataSync {
    if (!DataSync.instance) {
      DataSync.instance = new DataSync();
    }
    return DataSync.instance;
  }
  
  async applyServerUpdates(updates: Record<string, ServerUpdate[]>): Promise<void> {
    for (const [entityType, entityUpdates] of Object.entries(updates)) {
      for (const update of entityUpdates) {
        await this.applyUpdate(entityType, update);
      }
    }
    
    await this.saveMetadata();
  }
  
  private async applyUpdate(entityType: string, update: ServerUpdate): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(entityType, update.entityId);
      
      switch (update.operation) {
        case 'CREATE':
        case 'UPDATE':
          // Store in cache
          await AsyncStorage.setItem(cacheKey, JSON.stringify({
            data: update.data,
            timestamp: update.timestamp,
            version: this.getNextVersion(entityType, update.entityId),
          }));
          
          // Update React Query cache
          this.updateQueryCache(entityType, update.entityId, update.data);
          break;
          
        case 'DELETE':
          // Remove from cache
          await AsyncStorage.removeItem(cacheKey);
          
          // Remove from React Query cache
          this.removeFromQueryCache(entityType, update.entityId);
          break;
      }
      
      this.metadata.successCount++;
    } catch (error) {
      console.error(`Failed to apply update for ${entityType}:${update.entityId}:`, error);
      this.metadata.conflictCount++;
    }
  }
  
  private updateQueryCache(entityType: string, entityId: string, data: any): void {
    // Update individual entity query
    queryClient.setQueryData([entityType, entityId], data);
    
    // Update list queries
    queryClient.setQueriesData(
      { queryKey: [entityType] },
      (oldData: any) => {
        if (!oldData) return oldData;
        
        if (Array.isArray(oldData)) {
          const index = oldData.findIndex(item => item.id === entityId);
          if (index >= 0) {
            oldData[index] = data;
          } else {
            oldData.push(data);
          }
          return [...oldData];
        }
        
        return oldData;
      }
    );
  }
  
  private removeFromQueryCache(entityType: string, entityId: string): void {
    // Remove individual entity query
    queryClient.removeQueries({ queryKey: [entityType, entityId] });
    
    // Update list queries
    queryClient.setQueriesData(
      { queryKey: [entityType] },
      (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.filter(item => item.id !== entityId);
      }
    );
  }
  
  private getCacheKey(entityType: string, entityId: string): string {
    return `cache:${entityType}:${entityId}`;
  }
  
  private getNextVersion(entityType: string, entityId: string): number {
    if (!this.metadata.entityVersions[entityType]) {
      this.metadata.entityVersions[entityType] = {};
    }
    
    const currentVersion = this.metadata.entityVersions[entityType][entityId] || 0;
    this.metadata.entityVersions[entityType][entityId] = currentVersion + 1;
    
    return currentVersion + 1;
  }
  
  async getLocalData(entityType: string, entityId: string): Promise<any | null> {
    const cacheKey = this.getCacheKey(entityType, entityId);
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.data;
    }
    
    return null;
  }
  
  async getCachedEntities(entityType: string): Promise<any[]> {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = `cache:${entityType}:`;
    const entityKeys = keys.filter(key => key.startsWith(prefix));
    
    const entities = await Promise.all(
      entityKeys.map(async (key) => {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          return parsed.data;
        }
        return null;
      })
    );
    
    return entities.filter(entity => entity !== null);
  }
  
  async getLastSyncTimestamp(): Promise<Date> {
    return new Date(this.metadata.lastSyncTimestamp);
  }
  
  async updateLastSyncTimestamp(timestamp: Date): Promise<void> {
    this.metadata.lastSyncTimestamp = timestamp.toISOString();
    await this.saveMetadata();
  }
  
  async getSyncMetadata(): Promise<SyncMetadata> {
    return { ...this.metadata };
  }
  
  async clearCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache:'));
    await AsyncStorage.multiRemove(cacheKeys);
    
    this.metadata.entityVersions = {};
    this.metadata.conflictCount = 0;
    this.metadata.successCount = 0;
    
    await this.saveMetadata();
  }
  
  private async loadMetadata(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('sync_metadata');
      if (stored) {
        this.metadata = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync metadata:', error);
    }
  }
  
  private async saveMetadata(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_metadata', JSON.stringify(this.metadata));
    } catch (error) {
      console.error('Failed to save sync metadata:', error);
    }
  }
}

export const dataSync = DataSync.getInstance();