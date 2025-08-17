// Mobile-specific storage exports

// Export all storage interfaces and types
export * from './storage.interface';
export * from './token-storage.interface';

// Export storage implementations
export { MobileStorage } from './mobile-storage';
export { TokenStorage } from './token-storage';

// Import types for better type safety
import type { StorageConfig, UnifiedStorage } from './storage.interface';
import { MobileStorage } from './mobile-storage';
import { TokenStorage } from './token-storage';

// Export storage factory function for mobile
export function createStorage(config?: StorageConfig): UnifiedStorage {
  return new MobileStorage(config);
}

// Export token storage factory
export function createTokenStorage(storage: UnifiedStorage): TokenStorage {
  return new TokenStorage(storage);
}

// Default storage instance for auth operations
export const authStorage = createStorage();

// Default storage instance for general use
export const storage = createStorage();

// Default token storage instance
export const tokenStorage = createTokenStorage(authStorage);