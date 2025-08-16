/**
 * Base storage interface for simple key-value operations
 * Platform-agnostic async interface
 */
export interface StorageProvider {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet(keys: string[]): Promise<Array<[string, string | null]>>;
  multiSet(keyValuePairs: Array<[string, string]>): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
}

/**
 * Secure storage interface for sensitive data (tokens, passwords, etc.)
 * Automatically encrypted on supported platforms
 */
export interface SecureStorageProvider {
  setSecureItem(key: string, value: string): Promise<void>;
  getSecureItem(key: string): Promise<string | null>;
  removeSecureItem(key: string): Promise<void>;
  clearSecureStorage(): Promise<void>;
  isAvailable(): Promise<boolean>;
}

/**
 * Combined storage interface that provides both regular and secure storage
 */
export interface UnifiedStorage extends StorageProvider, SecureStorageProvider {
  // Convenience methods for common data types
  setObject<T>(key: string, value: T): Promise<void>;
  getObject<T>(key: string): Promise<T | null>;
  setNumber(key: string, value: number): Promise<void>;
  getNumber(key: string): Promise<number | null>;
  setBoolean(key: string, value: boolean): Promise<void>;
  getBoolean(key: string): Promise<boolean | null>;
  
  // Batch operations with type safety
  setBatch(items: Record<string, any>): Promise<void>;
  getBatch(keys: string[]): Promise<Record<string, any>>;
  
  // Storage info
  getSize(): Promise<number>;
  getInfo(): Promise<StorageInfo>;
}

/**
 * Storage information and statistics
 */
export interface StorageInfo {
  totalKeys: number;
  estimatedSize: number; // in bytes
  platform: 'web' | 'mobile';
  secureStorageAvailable: boolean;
  encryptionEnabled: boolean;
}

/**
 * Storage configuration options
 */
export interface StorageConfig {
  // Encryption
  encryptionKey?: string;
  enableEncryption?: boolean;
  
  // Prefixes for organization
  keyPrefix?: string;
  secureKeyPrefix?: string;
  
  // Platform-specific options
  web?: {
    useSessionStorage?: boolean;
    fallbackToMemory?: boolean;
  };
  mobile?: {
    mmkvInstanceId?: string;
    secureStoreOptions?: any;
  };
}

/**
 * Storage error types
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: StorageErrorCode,
    public platform: 'web' | 'mobile'
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export enum StorageErrorCode {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}