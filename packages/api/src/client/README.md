# Unified API Client

A platform-agnostic HTTP client for the StarTynk monorepo that provides consistent API interaction across web and mobile platforms.

## Features

- **Unified Interface**: Same API for both web and mobile platforms
- **Automatic Authentication**: Integrates with the unified auth service
- **Smart Caching**: Platform-optimized caching (localStorage for web, MMKV for mobile)
- **Offline Support**: Mobile queue for offline requests (structure ready for implementation)
- **Error Handling**: Consistent error handling with automatic auth refresh
- **Type Safety**: Full TypeScript support with proper types

## Installation

The API client is already part of the `@repo/api` package. Import it in your apps:

```typescript
// Web app
import { createWebAPIClient } from '@repo/api/client';

// Mobile app  
import { createMobileAPIClient } from '@repo/api/client';

// Auto-detect platform
import { createAPIClient } from '@repo/api/client';
```

## Usage

### Basic Setup

```typescript
import { createAPIClient } from '@repo/api/client';
import { authService } from '@repo/auth';

// Create client with auth service
const apiClient = createAPIClient(
  process.env.NEXT_PUBLIC_API_URL, // or EXPO_PUBLIC_API_URL
  authService
);
```

### Making Requests

```typescript
// GET request with caching
const users = await apiClient.get('/users');

// POST request
const newUser = await apiClient.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
const updatedUser = await apiClient.put('/users/123', {
  name: 'Jane Doe'
});

// DELETE request
await apiClient.delete('/users/123');

// With custom options
const data = await apiClient.get('/users', {
  cache: 'no-cache', // Bypass cache
  timeout: 5000,     // 5 second timeout
  requireAuth: false // Skip auth header
});
```

### Cache Management

```typescript
// Clear all cached data
await apiClient.clearCache();

// Control cache behavior per request
const freshData = await apiClient.get('/users', {
  cache: 'reload' // Force fresh data
});

// Set custom cache TTL (seconds)
const cachedData = await apiClient.get('/users', {
  cacheTTL: 600 // Cache for 10 minutes
});
```

### Error Handling

The client automatically handles common errors:

```typescript
try {
  const data = await apiClient.get('/protected-resource');
} catch (error) {
  if (error.status === 401) {
    // Auth error - client will auto-refresh token and retry
  } else if (error.isNetworkError) {
    // Network error - mobile will queue for later
  } else if (error.isTimeoutError) {
    // Request timeout
  }
}
```

### Platform-Specific Features

#### Web Platform
- Uses native `fetch` API
- Browser cache integration
- Lightweight implementation

#### Mobile Platform  
- Uses `axios` for better React Native support
- MMKV encrypted cache
- Offline queue support (ready for implementation)
- Automatic retry with exponential backoff

## Architecture

```
UnifiedAPIClient
├── HTTPAdapter (Platform-specific)
│   ├── WebHTTPAdapter (fetch)
│   └── MobileHTTPAdapter (axios)
├── CacheManager (Platform-specific)
│   ├── WebCacheManager (localStorage)
│   └── MobileCacheManager (MMKV)
├── AuthService (Unified)
└── QueueManager (Mobile only - future)
```

## Configuration

### Request Options

```typescript
interface RequestConfig {
  // HTTP options
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  
  // Cache options
  cache?: 'default' | 'no-cache' | 'reload' | 'force-cache';
  cacheTTL?: number; // seconds
  
  // Auth options
  requireAuth?: boolean;
  skipAuthRefresh?: boolean;
  
  // Response options
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  validateStatus?: (status: number) => boolean;
  
  // Mobile-specific
  offlineQueue?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
}
```

## Next Steps

1. **Implement Offline Queue**: Complete the mobile offline queue implementation
2. **Add Interceptors**: Global request/response interceptors
3. **Request Cancellation**: Add AbortController support
4. **Progress Tracking**: Upload/download progress events
5. **Batch Requests**: Support for batching multiple requests