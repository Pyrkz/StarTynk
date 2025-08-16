import { createWebAPIClient } from '@repo/api/client';
import { authService } from '@repo/auth';

/**
 * Unified API client instance for the web app
 * Automatically handles authentication, caching, and error handling
 */
export const apiClient = createWebAPIClient(
  process.env.NEXT_PUBLIC_API_URL,
  authService
);

// Example usage:
// const users = await apiClient.get('/users');
// const newUser = await apiClient.post('/users', { name: 'John', email: 'john@example.com' });