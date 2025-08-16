import { createMobileAPIClient } from '@repo/api/client';
import { authService } from '@repo/auth';

/**
 * Unified API client instance for the mobile app
 * Includes offline support, MMKV caching, and automatic retry logic
 */
export const apiClient = createMobileAPIClient(
  process.env.EXPO_PUBLIC_API_URL,
  authService
);

// Example usage:
// const users = await apiClient.get('/users');
// const newUser = await apiClient.post('/users', { name: 'John', email: 'john@example.com' });