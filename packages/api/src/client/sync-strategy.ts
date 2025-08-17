import { ConnectionQuality, type QueuedOperation, type NetworkState, type SyncResult } from './types/offline.types';

/**
 * Smart sync strategy for optimal data synchronization
 */
export class SyncStrategy {
  /**
   * Determine optimal sync order based on priorities and dependencies
   */
  async determineSyncOrder(operations: QueuedOperation[]): Promise<QueuedOperation[]> {
    // Group operations by resource and method
    const grouped = this.groupOperations(operations);
    
    // Build dependency graph
    const dependencies = this.buildDependencyGraph(grouped);
    
    // Topological sort with priority consideration
    return await this.topologicalSortWithPriority(operations, dependencies);
  }

  /**
   * Check if sync should proceed based on network state
   */
  async shouldSync(networkState: NetworkState): Promise<boolean> {
    // Must be connected and reachable
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      return false;
    }

    // Check connection quality
    if (networkState.type === 'cellular' && networkState.strength === 'poor') {
      // Only sync critical operations on poor cellular
      return false;
    }

    return true;
  }

  /**
   * Calculate batch size based on connection quality
   */
  async calculateBatchSize(quality: ConnectionQuality): Promise<number> {
    switch (quality) {
      case ConnectionQuality.EXCELLENT:
        return 20; // WiFi/5G - large batches
      case ConnectionQuality.GOOD:
        return 10; // 4G - medium batches
      case ConnectionQuality.FAIR:
        return 5;  // 3G - small batches
      case ConnectionQuality.POOR:
        return 2;  // 2G - minimal batches
      default:
        return 0;  // Offline - no sync
    }
  }

  /**
   * Prioritize operations for sync
   */
  async prioritizeOperations(operations: QueuedOperation[]): Promise<QueuedOperation[]> {
    return operations.sort((a, b) => {
      // Priority order
      const priorityWeight = {
        critical: 0,
        high: 1,
        normal: 2,
        low: 3,
      };

      const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Within same priority, consider:
      // 1. Failed retry count (fewer retries first)
      if (a.retryCount !== b.retryCount) {
        return a.retryCount - b.retryCount;
      }

      // 2. Age (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Full sync - sync all data
   */
  async fullSync(): Promise<SyncResult> {
    console.log('Performing full sync...');
    // This would be implemented based on your specific sync requirements
    return {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      newData: [],
      errors: [],
    };
  }

  /**
   * Incremental sync - sync changes since last sync
   */
  async incrementalSync(lastSyncTime: number): Promise<SyncResult> {
    console.log(`Performing incremental sync since ${new Date(lastSyncTime).toISOString()}`);
    // This would be implemented based on your specific sync requirements
    return {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      newData: [],
      errors: [],
    };
  }

  /**
   * Delta sync - sync only differences
   */
  async deltaSync(version: number): Promise<SyncResult> {
    console.log(`Performing delta sync from version ${version}`);
    // This would be implemented based on your specific sync requirements
    return {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      newData: [],
      errors: [],
    };
  }

  /**
   * Selective sync - sync specific entities
   */
  async selectiveSync(entities: string[]): Promise<SyncResult> {
    console.log(`Performing selective sync for entities: ${entities.join(', ')}`);
    // This would be implemented based on your specific sync requirements
    return {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      newData: [],
      errors: [],
    };
  }

  /**
   * Determine sync strategy based on context
   */
  determineStrategy(
    lastSyncTime: number,
    syncVersion: number,
    queueSize: number,
    connectionQuality: ConnectionQuality
  ): 'full' | 'incremental' | 'delta' | 'selective' {
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTime;
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    // Full sync if never synced or very old
    if (lastSyncTime === 0 || timeSinceLastSync > oneWeek) {
      return 'full';
    }

    // Delta sync if we have version info and good connection
    if (syncVersion > 0 && connectionQuality >= ConnectionQuality.GOOD) {
      return 'delta';
    }

    // Selective sync if poor connection and large queue
    if (connectionQuality <= ConnectionQuality.FAIR && queueSize > 10) {
      return 'selective';
    }

    // Default to incremental
    return 'incremental';
  }

  // Private helper methods

  private groupOperations(operations: QueuedOperation[]): Map<string, QueuedOperation[]> {
    const grouped = new Map<string, QueuedOperation[]>();
    
    for (const op of operations) {
      const key = `${op.method}:${op.endpoint}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(op);
    }

    return grouped;
  }

  private buildDependencyGraph(
    grouped: Map<string, QueuedOperation[]>
  ): Map<string, Set<string>> {
    const dependencies = new Map<string, Set<string>>();
    
    // Build dependencies based on operation order and relationships
    for (const [key, ops] of Array.from(grouped.entries())) {
      const [method, endpoint] = key.split(':');
      
      // POST operations should happen before PUT/PATCH on same resource
      if (method === 'PUT' || method === 'PATCH') {
        const postKey = `POST:${endpoint}`;
        if (grouped.has(postKey)) {
          if (!dependencies.has(key)) {
            dependencies.set(key, new Set());
          }
          dependencies.get(key)!.add(postKey);
        }
      }
      
      // DELETE should happen after all other operations on same resource
      if (method === 'DELETE') {
        for (const [otherKey] of Array.from(grouped.entries())) {
          if (otherKey !== key && otherKey.includes(endpoint)) {
            if (!dependencies.has(key)) {
              dependencies.set(key, new Set());
            }
            dependencies.get(key)!.add(otherKey);
          }
        }
      }
    }

    return dependencies;
  }

  private async topologicalSortWithPriority(
    operations: QueuedOperation[],
    dependencies: Map<string, Set<string>>
  ): Promise<QueuedOperation[]> {
    const sorted: QueuedOperation[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const getOpKey = (op: QueuedOperation) => `${op.method}:${op.endpoint}:${op.id}`;

    const visit = (op: QueuedOperation) => {
      const key = getOpKey(op);
      
      if (visited.has(key)) return;
      if (visiting.has(key)) {
        console.warn('Circular dependency detected:', key);
        return;
      }

      visiting.add(key);

      // Visit dependencies first
      const depKey = `${op.method}:${op.endpoint}`;
      const deps = dependencies.get(depKey);
      if (deps) {
        for (const dep of Array.from(deps)) {
          const depOps = operations.filter(o => 
            `${o.method}:${o.endpoint}` === dep && !visited.has(getOpKey(o))
          );
          for (const depOp of depOps) {
            visit(depOp);
          }
        }
      }

      visiting.delete(key);
      visited.add(key);
      sorted.push(op);
    };

    // Sort by priority first
    const prioritized = await this.prioritizeOperations(operations);
    
    // Visit all operations
    for (const op of prioritized) {
      visit(op);
    }

    return sorted;
  }
}