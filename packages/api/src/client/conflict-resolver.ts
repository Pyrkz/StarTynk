import { Alert } from 'react-native';
import type { ConflictStrategy, ConflictMetadata, MergeRules, Timestamps } from './types/offline.types';

/**
 * Conflict resolution system for offline data sync
 */
export class ConflictResolver {
  /**
   * Resolve conflict between local and remote data
   */
  async resolve<T>(
    local: T,
    remote: T,
    strategy: ConflictStrategy = 'merge',
    metadata?: ConflictMetadata
  ): Promise<T> {
    switch (strategy) {
      case 'last-write-wins':
        return this.lastWriteWins(local, remote, {
          local: metadata?.localTimestamp || Date.now(),
          remote: metadata?.remoteTimestamp || Date.now(),
        });
      
      case 'merge':
        return this.merge(local, remote);
      
      case 'user-choice':
        return this.userChoice(local, remote);
      
      case 'fail':
        throw new Error('Conflict resolution failed - manual intervention required');
      
      default:
        return this.autoResolve(local, remote, metadata);
    }
  }

  /**
   * Last write wins strategy
   */
  async lastWriteWins<T>(local: T, remote: T, timestamps: Timestamps): Promise<T> {
    // Simple timestamp comparison
    if (timestamps.local > timestamps.remote) {
      console.debug('Conflict resolved: local wins', { 
        localTime: new Date(timestamps.local).toISOString(),
        remoteTime: new Date(timestamps.remote).toISOString(),
      });
      return local;
    }
    
    console.debug('Conflict resolved: remote wins', {
      localTime: new Date(timestamps.local).toISOString(),
      remoteTime: new Date(timestamps.remote).toISOString(),
    });
    return remote;
  }

  /**
   * Merge strategy with intelligent field-level merging
   */
  async merge<T>(local: T, remote: T, mergeRules?: MergeRules): Promise<T> {
    // Handle null/undefined cases
    if (local === null || local === undefined) return remote;
    if (remote === null || remote === undefined) return local;
    
    // Handle primitive types
    if (typeof local !== 'object' || typeof remote !== 'object') {
      // For primitives, use the remote value (server wins)
      return remote;
    }

    // Handle arrays
    if (Array.isArray(local) && Array.isArray(remote)) {
      return this.mergeArrays(local, remote, mergeRules?.arrays || 'union') as T;
    }

    // Handle objects
    return this.mergeObjects(
      local as Record<string, any>,
      remote as Record<string, any>,
      mergeRules
    ) as T;
  }

  /**
   * User choice strategy - show UI picker
   */
  async userChoice<T>(local: T, remote: T): Promise<T> {
    return new Promise((resolve) => {
      Alert.alert(
        'Data Conflict',
        'Your local changes conflict with server data. Which version would you like to keep?',
        [
          {
            text: 'Keep Mine',
            onPress: () => resolve(local),
            style: 'default',
          },
          {
            text: 'Use Server',
            onPress: () => resolve(remote),
            style: 'default',
          },
          {
            text: 'View Details',
            onPress: () => this.showDetailedConflict(local, remote, resolve),
            style: 'cancel',
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Automatic intelligent resolution
   */
  async autoResolve<T>(local: T, remote: T, metadata?: ConflictMetadata): Promise<T> {
    // If we have metadata, use it for intelligent resolution
    if (metadata) {
      // If local is much newer (> 1 hour), probably has user's latest work
      const timeDiff = metadata.localTimestamp - metadata.remoteTimestamp;
      if (timeDiff > 3600000) {
        console.debug('Auto-resolve: local is significantly newer');
        return local;
      }
      
      // If remote is newer, server probably has latest
      if (timeDiff < 0) {
        console.debug('Auto-resolve: remote is newer');
        return remote;
      }
    }

    // Try to merge intelligently
    try {
      const merged = await this.merge(local, remote, {
        arrays: 'union',
        objects: 'deep',
        serverWins: ['id', 'createdAt', 'version', '_id'],
        localWins: ['draft', 'localNotes', 'preferences'],
      });
      console.debug('Auto-resolve: successful merge');
      return merged;
    } catch (error) {
      console.warn('Auto-resolve: merge failed, using remote', error);
      return remote; // Safe default: use server version
    }
  }

  /**
   * Detect if two objects have conflicts
   */
  hasConflicts<T>(local: T, remote: T): boolean {
    // Quick check for identity
    if (local === remote) return false;
    
    // Check for null/undefined
    if (local == null || remote == null) return true;
    
    // For primitives, simple comparison
    if (typeof local !== 'object' || typeof remote !== 'object') {
      return local !== remote;
    }

    // For objects, check each field
    const localObj = local as Record<string, any>;
    const remoteObj = remote as Record<string, any>;
    
    const allKeys = new Set([
      ...Object.keys(localObj),
      ...Object.keys(remoteObj),
    ]);

    for (const key of allKeys) {
      // Skip system fields
      if (['id', '_id', 'createdAt', 'updatedAt'].includes(key)) {
        continue;
      }

      if (this.hasConflicts(localObj[key], remoteObj[key])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get conflict summary for logging/debugging
   */
  getConflictSummary<T>(local: T, remote: T): {
    hasConflicts: boolean;
    conflictingFields: string[];
    summary: string;
  } {
    const conflictingFields: string[] = [];
    
    if (typeof local === 'object' && local !== null && 
        typeof remote === 'object' && remote !== null) {
      const localObj = local as Record<string, any>;
      const remoteObj = remote as Record<string, any>;
      
      const allKeys = new Set([
        ...Object.keys(localObj),
        ...Object.keys(remoteObj),
      ]);

      for (const key of allKeys) {
        if (this.hasConflicts(localObj[key], remoteObj[key])) {
          conflictingFields.push(key);
        }
      }
    }

    return {
      hasConflicts: conflictingFields.length > 0,
      conflictingFields,
      summary: conflictingFields.length > 0
        ? `Conflicts in: ${conflictingFields.join(', ')}`
        : 'No conflicts detected',
    };
  }

  // Private helper methods

  private mergeArrays(local: any[], remote: any[], strategy: 'union' | 'concat' | 'replace'): any[] {
    switch (strategy) {
      case 'union':
        // Remove duplicates based on 'id' field if present
        const combined = [...local, ...remote];
        const seen = new Set();
        return combined.filter(item => {
          if (item && typeof item === 'object' && 'id' in item) {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
          }
          return true;
        });
      
      case 'concat':
        return [...local, ...remote];
      
      case 'replace':
        return remote;
      
      default:
        return remote;
    }
  }

  private mergeObjects(
    local: Record<string, any>,
    remote: Record<string, any>,
    rules?: MergeRules
  ): Record<string, any> {
    const merged: Record<string, any> = {};
    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const key of allKeys) {
      // Check if server should win for this field
      if (rules?.serverWins?.includes(key)) {
        merged[key] = remote[key];
        continue;
      }

      // Check if local should win for this field
      if (rules?.localWins?.includes(key)) {
        merged[key] = local[key];
        continue;
      }

      // Both have the field
      if (key in local && key in remote) {
        const localVal = local[key];
        const remoteVal = remote[key];

        // Same value, no conflict
        if (localVal === remoteVal) {
          merged[key] = localVal;
          continue;
        }

        // Different values - need to merge
        if (typeof localVal === 'object' && typeof remoteVal === 'object') {
          if (Array.isArray(localVal) && Array.isArray(remoteVal)) {
            merged[key] = this.mergeArrays(localVal, remoteVal, rules?.arrays || 'union');
          } else if (localVal !== null && remoteVal !== null) {
            // Recursive merge for nested objects
            merged[key] = rules?.objects === 'shallow' 
              ? remoteVal 
              : this.mergeObjects(localVal, remoteVal, rules);
          } else {
            // One is null - use the non-null value
            merged[key] = localVal ?? remoteVal;
          }
        } else {
          // Different primitive values - use remote (server wins)
          merged[key] = remoteVal;
        }
      } else if (key in local) {
        // Only local has it
        merged[key] = local[key];
      } else {
        // Only remote has it
        merged[key] = remote[key];
      }
    }

    return merged;
  }

  private showDetailedConflict<T>(local: T, remote: T, resolve: (value: T) => void): void {
    const summary = this.getConflictSummary(local, remote);
    
    Alert.alert(
      'Conflict Details',
      `${summary.summary}\n\nLocal version: ${JSON.stringify(local, null, 2).substring(0, 200)}...\n\nServer version: ${JSON.stringify(remote, null, 2).substring(0, 200)}...`,
      [
        {
          text: 'Keep Mine',
          onPress: () => resolve(local),
        },
        {
          text: 'Use Server',
          onPress: () => resolve(remote),
        },
        {
          text: 'Try Merge',
          onPress: async () => {
            try {
              const merged = await this.merge(local, remote);
              resolve(merged);
            } catch (error) {
              Alert.alert('Merge Failed', 'Could not automatically merge. Please choose a version.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  }
}