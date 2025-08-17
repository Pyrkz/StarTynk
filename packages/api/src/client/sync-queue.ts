import { MMKV } from 'react-native-mmkv';
import { v4 as uuidv4 } from 'uuid';
import type { QueuedOperation } from './types/offline.types';

/**
 * Sync queue for offline operations
 */
export class SyncQueue {
  private queue: MMKV;
  private readonly QUEUE_KEY = 'sync-queue-operations';

  constructor() {
    this.queue = new MMKV({
      id: 'sync-queue',
      encryptionKey: this.generateEncryptionKey(),
    });
  }

  /**
   * Add operation to queue
   */
  async enqueue(operation: Omit<QueuedOperation, 'id'>): Promise<string> {
    const id = uuidv4();
    const queuedOp: QueuedOperation = {
      ...operation,
      id,
    };

    // Get current queue
    const operations = await this.getOperations();
    operations.push(queuedOp);
    
    // Save updated queue
    this.saveOperations(operations);

    // Log for debugging
    console.debug(`Queued ${operation.method} ${operation.endpoint}`, { id, priority: operation.priority });

    return id;
  }

  /**
   * Remove operation from queue
   */
  async dequeue(): Promise<QueuedOperation | null> {
    const operations = await this.getOperations();
    if (operations.length === 0) return null;

    // Get highest priority operation
    const sorted = this.sortByPriority(operations);
    const operation = sorted.shift();

    if (operation) {
      // Save remaining operations
      this.saveOperations(sorted);
      return operation;
    }

    return null;
  }

  /**
   * Peek at queued operations without removing
   */
  async peek(): Promise<QueuedOperation[]> {
    const operations = await this.getOperations();
    return this.sortByPriority(operations);
  }

  /**
   * Remove specific operation
   */
  async remove(id: string): Promise<void> {
    const operations = await this.getOperations();
    const filtered = operations.filter(op => op.id !== id);
    this.saveOperations(filtered);
  }

  /**
   * Update retry count for operation
   */
  async retry(id: string): Promise<void> {
    const operations = await this.getOperations();
    const operation = operations.find(op => op.id === id);
    
    if (operation) {
      operation.retryCount++;
      this.saveOperations(operations);
    }
  }

  /**
   * Clear all queued operations
   */
  async clear(): Promise<void> {
    this.queue.delete(this.QUEUE_KEY);
  }

  /**
   * Get failed operations (exceeded retry limit)
   */
  async getFailedOperations(): Promise<QueuedOperation[]> {
    const operations = await this.getOperations();
    return operations.filter(op => op.retryCount >= op.maxRetries);
  }

  /**
   * Get operations by priority
   */
  async getByPriority(priority: 'low' | 'normal' | 'high' | 'critical'): Promise<QueuedOperation[]> {
    const operations = await this.getOperations();
    return operations.filter(op => op.priority === priority);
  }

  /**
   * Get operations by endpoint pattern
   */
  async getByEndpoint(pattern: string): Promise<QueuedOperation[]> {
    const operations = await this.getOperations();
    const regex = new RegExp(pattern);
    return operations.filter(op => regex.test(op.endpoint));
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    total: number;
    byPriority: Record<string, number>;
    byMethod: Record<string, number>;
    failed: number;
    avgRetries: number;
    oldestOperation: QueuedOperation | null;
  }> {
    const operations = await this.getOperations();
    
    const stats = {
      total: operations.length,
      byPriority: {} as Record<string, number>,
      byMethod: {} as Record<string, number>,
      failed: 0,
      avgRetries: 0,
      oldestOperation: null as QueuedOperation | null,
    };

    if (operations.length === 0) return stats;

    let totalRetries = 0;
    let oldestTimestamp = Date.now();

    for (const op of operations) {
      // Count by priority
      stats.byPriority[op.priority] = (stats.byPriority[op.priority] || 0) + 1;
      
      // Count by method
      stats.byMethod[op.method] = (stats.byMethod[op.method] || 0) + 1;
      
      // Count failed
      if (op.retryCount >= op.maxRetries) {
        stats.failed++;
      }
      
      // Track retries
      totalRetries += op.retryCount;
      
      // Find oldest
      if (op.timestamp < oldestTimestamp) {
        oldestTimestamp = op.timestamp;
        stats.oldestOperation = op;
      }
    }

    stats.avgRetries = totalRetries / operations.length;

    return stats;
  }

  /**
   * Batch enqueue multiple operations
   */
  async enqueueBatch(operations: Array<Omit<QueuedOperation, 'id'>>): Promise<string[]> {
    const ids: string[] = [];
    const currentOps = await this.getOperations();

    for (const operation of operations) {
      const id = uuidv4();
      const queuedOp: QueuedOperation = {
        ...operation,
        id,
      };
      currentOps.push(queuedOp);
      ids.push(id);
    }

    this.saveOperations(currentOps);
    return ids;
  }

  /**
   * Move operation to different priority
   */
  async changePriority(id: string, newPriority: 'low' | 'normal' | 'high' | 'critical'): Promise<void> {
    const operations = await this.getOperations();
    const operation = operations.find(op => op.id === id);
    
    if (operation) {
      operation.priority = newPriority;
      this.saveOperations(operations);
    }
  }

  /**
   * Get operations that should be synced based on network quality
   */
  async getOperationsForSync(connectionQuality: number, limit?: number): Promise<QueuedOperation[]> {
    const operations = await this.getOperations();
    
    // Filter based on connection quality
    let filtered: QueuedOperation[];
    
    switch (connectionQuality) {
      case 4: // Excellent - all operations
        filtered = operations;
        break;
      case 3: // Good - skip low priority analytics
        filtered = operations.filter(op => 
          !(op.priority === 'low' && op.endpoint.includes('/analytics'))
        );
        break;
      case 2: // Fair - only normal and high priority
        filtered = operations.filter(op => 
          op.priority === 'normal' || op.priority === 'high' || op.priority === 'critical'
        );
        break;
      case 1: // Poor - only high priority
        filtered = operations.filter(op => 
          op.priority === 'high' || op.priority === 'critical'
        );
        break;
      default: // Offline
        return [];
    }

    // Sort by priority and timestamp
    const sorted = this.sortByPriority(filtered);
    
    // Apply limit if specified
    return limit ? sorted.slice(0, limit) : sorted;
  }

  // Private helper methods

  private generateEncryptionKey(): string {
    // In production, this should be generated once and stored securely
    return 'sync-queue-encryption-key-' + Date.now();
  }

  private async getOperations(): Promise<QueuedOperation[]> {
    try {
      const data = this.queue.getString(this.QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveOperations(operations: QueuedOperation[]): void {
    this.queue.set(this.QUEUE_KEY, JSON.stringify(operations));
  }

  private sortByPriority(operations: QueuedOperation[]): QueuedOperation[] {
    const priorityOrder = { 
      critical: 0, 
      high: 1, 
      normal: 2, 
      low: 3 
    };

    return [...operations].sort((a, b) => {
      // Sort by priority first
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by timestamp (FIFO within same priority)
      return a.timestamp - b.timestamp;
    });
  }
}