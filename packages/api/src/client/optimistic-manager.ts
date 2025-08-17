import { v4 as uuidv4 } from 'uuid';
import type { OptimisticData } from './types/offline.types';

/**
 * Optimistic update manager for instant UI feedback
 */
export class OptimisticManager {
  private optimisticData = new Map<string, OptimisticData>();
  private rollbackData = new Map<string, any>();

  /**
   * Apply optimistic update immediately
   */
  async applyOptimistic(key: string, data: any, rollbackData?: any): Promise<void> {
    const optimistic: OptimisticData = {
      key,
      data,
      rollbackData: rollbackData || this.rollbackData.get(key),
      timestamp: Date.now(),
    };

    this.optimisticData.set(key, optimistic);
    console.debug('Applied optimistic update:', { key, hasRollback: !!optimistic.rollbackData });
  }

  /**
   * Rollback optimistic update on failure
   */
  async rollback(key: string): Promise<void> {
    const optimistic = this.optimisticData.get(key);
    if (!optimistic) {
      console.warn('No optimistic data to rollback:', key);
      return;
    }

    this.optimisticData.delete(key);
    this.rollbackData.delete(key);
    
    console.debug('Rolled back optimistic update:', key);
  }

  /**
   * Commit optimistic update on success
   */
  async commit(key: string): Promise<void> {
    const optimistic = this.optimisticData.get(key);
    if (!optimistic) {
      console.warn('No optimistic data to commit:', key);
      return;
    }

    this.optimisticData.delete(key);
    this.rollbackData.delete(key);
    
    console.debug('Committed optimistic update:', key);
  }

  /**
   * Get optimistic data if available
   */
  async getOptimisticData(key: string): Promise<any | null> {
    const optimistic = this.optimisticData.get(key);
    return optimistic?.data || null;
  }

  /**
   * Generate optimistic response based on operation
   */
  generateOptimisticResponse(method: string, endpoint: string, data?: any): any {
    const timestamp = new Date().toISOString();
    const id = uuidv4();

    // Parse endpoint to determine resource type
    const pathParts = endpoint.split('/').filter(Boolean);
    const resourceType = pathParts[0];
    const resourceId = pathParts[1];

    switch (method.toUpperCase()) {
      case 'POST':
        return this.generateOptimisticCreate(resourceType, data, id, timestamp);
      
      case 'PUT':
      case 'PATCH':
        return this.generateOptimisticUpdate(resourceType, resourceId, data, timestamp);
      
      case 'DELETE':
        return this.generateOptimisticDelete(resourceType, resourceId);
      
      default:
        return null;
    }
  }

  /**
   * Merge optimistic data with real server response
   */
  mergeWithReal(optimistic: any, real: any): any {
    if (!optimistic || !real) return real || optimistic;

    // If real data has server-generated fields, use them
    const merged = { ...optimistic };
    
    // Always use server values for these fields
    const serverFields = ['id', '_id', 'createdAt', 'updatedAt', 'version', 'etag'];
    for (const field of serverFields) {
      if (field in real) {
        merged[field] = real[field];
      }
    }

    // Merge other fields
    for (const key in real) {
      if (!serverFields.includes(key)) {
        merged[key] = real[key];
      }
    }

    return merged;
  }

  /**
   * Check if there are pending optimistic updates
   */
  hasPendingUpdates(): boolean {
    return this.optimisticData.size > 0;
  }

  /**
   * Get all pending optimistic updates
   */
  getPendingUpdates(): Map<string, OptimisticData> {
    return new Map(this.optimisticData);
  }

  /**
   * Clear all optimistic updates (use with caution)
   */
  clearAll(): void {
    this.optimisticData.clear();
    this.rollbackData.clear();
  }

  /**
   * Clean up old optimistic updates (> 5 minutes)
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [key, data] of this.optimisticData.entries()) {
      if (now - data.timestamp > maxAge) {
        console.warn('Cleaning up stale optimistic update:', key);
        this.optimisticData.delete(key);
        this.rollbackData.delete(key);
      }
    }
  }

  // Private helper methods

  private generateOptimisticCreate(resourceType: string, data: any, id: string, timestamp: string): any {
    const base = {
      id,
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
      _optimistic: true,
      _syncPending: true,
    };

    // Resource-specific optimistic responses
    switch (resourceType) {
      case 'tasks':
        return {
          ...base,
          status: data.status || 'pending',
          completed: false,
          completedAt: null,
          assignedTo: data.assignedTo || null,
          priority: data.priority || 'normal',
        };
      
      case 'projects':
        return {
          ...base,
          status: 'active',
          progress: 0,
          tasksCount: 0,
          completedTasksCount: 0,
          members: data.members || [],
        };
      
      case 'comments':
        return {
          ...base,
          edited: false,
          reactions: [],
          attachments: data.attachments || [],
        };
      
      case 'users':
        return {
          ...base,
          isActive: true,
          emailVerified: false,
          role: data.role || 'user',
          preferences: data.preferences || {},
        };
      
      default:
        return base;
    }
  }

  private generateOptimisticUpdate(
    resourceType: string, 
    resourceId: string, 
    data: any, 
    timestamp: string
  ): any {
    const base = {
      ...data,
      id: resourceId,
      updatedAt: timestamp,
      _optimistic: true,
      _syncPending: true,
    };

    // Resource-specific updates
    switch (resourceType) {
      case 'tasks':
        if (data.completed !== undefined) {
          return {
            ...base,
            completedAt: data.completed ? timestamp : null,
            status: data.completed ? 'completed' : 'in_progress',
          };
        }
        return base;
      
      case 'projects':
        if (data.status === 'completed') {
          return {
            ...base,
            completedAt: timestamp,
            progress: 100,
          };
        }
        return base;
      
      default:
        return base;
    }
  }

  private generateOptimisticDelete(resourceType: string, resourceId: string): any {
    return {
      id: resourceId,
      _deleted: true,
      _optimistic: true,
      _syncPending: true,
      deletedAt: new Date().toISOString(),
    };
  }
}