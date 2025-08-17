import { createMobileAPIClient } from '@repo/api/mobile';
import { createMobileAuthService } from '@repo/auth';
import { env } from '../../config/environment';

/**
 * Unified API client instance for the mobile app
 * Includes offline support, MMKV caching, and automatic retry logic
 */
export const apiClient = createMobileAPIClient(
  env.current.apiUrl,
  createMobileAuthService()
);

// Example usage:
// const users = await apiClient.get('/users');
// const newUser = await apiClient.post('/users', { name: 'John', email: 'john@example.com' });