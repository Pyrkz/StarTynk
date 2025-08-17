/**
 * Offline-first API types
 */

import type { CacheEntry } from './client.types';

/**
 * Mobile API client configuration
 */
export interface MobileAPIConfig {
  enableOffline?: boolean;
  cacheTTL?: number; // seconds
  syncInterval?: number; // milliseconds
  conflictStrategy?: ConflictStrategy;
  maxRetries?: number;
  userId?: string;
  deviceId?: string;
  cacheConfig?: CacheConfig;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize?: number; // MB
  compressionThreshold?: number; // bytes
  encryptionKey?: string;
  ttlByEndpoint?: Record<string, number>;
}

/**
 * Network state information
 */
export interface NetworkState {
  isConnected: boolean;
  type: 'wifi' | 'cellular' | 'none';
  strength: 'excellent' | 'good' | 'fair' | 'poor';
  isInternetReachable: boolean;
  details: any;
}

/**
 * Connection quality levels
 */
export enum ConnectionQuality {
  OFFLINE = 0,
  POOR = 1,    // 2G-like
  FAIR = 2,    // 3G-like
  GOOD = 3,    // 4G-like
  EXCELLENT = 4 // WiFi/5G
}

/**
 * Queued operation for offline sync
 */
export interface QueuedOperation {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  conflictStrategy: ConflictStrategy;
  optimisticResponse?: any;
  rollbackData?: any;
  syncVersion?: number;
}

/**
 * Conflict resolution strategies
 */
export type ConflictStrategy = 'last-write-wins' | 'merge' | 'fail' | 'user-choice';

/**
 * Conflict metadata for resolution
 */
export interface ConflictMetadata {
  localTimestamp: number;
  remoteTimestamp: number;
  userId: string;
  deviceId: string;
  syncVersion?: number;
}

/**
 * Merge rules for conflict resolution
 */
export interface MergeRules {
  arrays?: 'union' | 'concat' | 'replace';
  objects?: 'deep' | 'shallow' | 'replace';
  serverWins?: string[]; // field names where server always wins
  localWins?: string[]; // field names where local always wins
}

/**
 * Sync result information
 */
export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  newData: any[];
  errors: SyncError[];
  nextSyncToken?: string;
}

/**
 * Sync error details
 */
export interface SyncError {
  operation?: QueuedOperation;
  message?: string;
  error?: any;
}

/**
 * Network listener callback
 */
export type NetworkListener = (state: NetworkState) => void | Promise<void>;

/**
 * Retry options for network requests
 */
export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Optimistic update data
 */
export interface OptimisticData {
  key: string;
  data: any;
  rollbackData?: any;
  timestamp: number;
}

/**
 * Cached data with metadata
 */
export interface CachedData extends CacheEntry {
  compressed?: boolean;
  size?: number;
  accessCount?: number;
  lastAccessed?: number;
}

/**
 * Timestamps for conflict resolution
 */
export interface Timestamps {
  local: number;
  remote: number;
  base?: number;
}