// Export all storage interfaces and types
export * from './storage.interface';

// Export storage implementations
export { MobileStorage } from './mobile-storage';
export { WebStorage } from './web-storage';

// Import types for better type safety
import type { StorageConfig, UnifiedStorage } from './storage.interface';
import { MobileStorage } from './mobile-storage';
import { WebStorage } from './web-storage';

// Export storage factory function for convenience
export function createStorage(platform: 'web' | 'mobile', config?: StorageConfig): UnifiedStorage {
  if (platform === 'mobile') {
    return new MobileStorage(config);
  } else {
    return new WebStorage(config);
  }
}

// Export platform detection utility
export function detectPlatform(): 'web' | 'mobile' {
  // Check for React Native environment
  if (typeof navigator !== 'undefined' && navigator?.product === 'ReactNative') {
    return 'mobile';
  }
  
  // Check for Expo environment
  if (typeof global !== 'undefined' && (global as any).__expo) {
    return 'mobile';
  }
  
  // Check for web environment
  if (typeof window !== 'undefined') {
    return 'web';
  }
  
  // Default to web for SSR/Node environments
  return 'web';
}

// Auto-create storage instance based on platform
export function createAutoStorage(config?: StorageConfig): UnifiedStorage {
  const platform = detectPlatform();
  return createStorage(platform, config);
}