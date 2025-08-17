// Web-specific storage exports

// Export all storage interfaces and types
export * from './storage.interface';

// Export only web storage implementation
export { WebStorage } from './web-storage';

// Import types for better type safety
import type { StorageConfig, UnifiedStorage } from './storage.interface';
import { WebStorage } from './web-storage';

// Export storage factory function for web
export function createStorage(config?: StorageConfig): UnifiedStorage {
  return new WebStorage(config);
}

// Simple localStorage wrapper for backward compatibility
export function createWebStorage<T = any>(options: {
  key: string;
  defaultValue?: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}) {
  const {
    key,
    defaultValue,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  return {
    get: (): T | undefined => {
      try {
        if (typeof window === 'undefined') return defaultValue;
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;
        return deserialize(item);
      } catch {
        return defaultValue;
      }
    },
    set: (value: T): void => {
      try {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, serialize(value));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    },
    remove: (): void => {
      try {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Failed to remove from localStorage:', error);
      }
    },
  };
}

// Default storage instance for auth operations
export const authStorage = createStorage();

// Default storage instance for general use
export const storage = createStorage();