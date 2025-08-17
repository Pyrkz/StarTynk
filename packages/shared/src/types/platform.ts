/**
 * Cross-platform type definitions for React Native and Node.js compatibility
 */

// Timeout types that work in both environments
export type PlatformTimeout = ReturnType<typeof setTimeout>;
export type PlatformInterval = ReturnType<typeof setInterval>;

// Type guard to check if we're in a Node.js environment
export const isNodeEnvironment = (): boolean => {
  return typeof process !== 'undefined' && process.versions && !!process.versions.node;
};

// Type guard to check if we're in a React Native environment
export const isReactNativeEnvironment = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
};

// Type guard to check if we're in a web environment
export const isWebEnvironment = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};