# @repo/api

Production-ready unified API package for the StarTynk monorepo.

## Features

- ✅ **Standardized Response Format** - Consistent API responses across all endpoints
- ✅ **Production-Ready Error Handling** - Comprehensive error classes and middleware
- ✅ **Rate Limiting** - Multiple rate limiting strategies with LRU cache
- ✅ **Request Validation** - Zod-based validation for all inputs
- ✅ **Business Logic Separation** - Clean separation between route handlers and business logic
- ✅ **Structured Logging** - JSON structured logging with request tracking
- ✅ **CORS Support** - Configurable CORS middleware
- ✅ **Type Safety** - Full TypeScript support with comprehensive types

## Structure

```
src/
├── handlers/           # Business logic handlers
│   ├── auth/          # Authentication handlers
│   ├── users/         # User management handlers
│   └── projects/      # Project management handlers
├── middleware/        # Reusable middleware functions
├── validators/        # Zod validation schemas
├── responses/         # Standardized response helpers
├── errors/           # Custom error classes
├── utils/            # Utility functions
└── types/            # TypeScript type definitions
```

## Usage

```typescript
import {
  loginHandler,
  validateBody,
  loginSchema,
  authRateLimit,
  errorHandler,
  loggingMiddleware
} from '@repo/api';

export async function POST(request: Request) {
  return loggingMiddleware(request, async (req) => {
    try {
      await authRateLimit(req);
      const input = await validateBody(loginSchema)(req);
      return await loginHandler(input);
    } catch (error) {
      return await errorHandler(error, req);
    }
  });
}
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Available Handlers

### Authentication
- `loginHandler` - User login with email/phone
- `logoutHandler` - User logout with token invalidation
- `refreshHandler` - Token refresh

### Users
- `listUsersHandler` - Paginated user listing with filters
- `getUserHandler` - Get single user by ID
- `createUserHandler` - Create new user
- `updateUserHandler` - Update existing user
- `deleteUserHandler` - Soft delete user

### Projects
- `listProjectsHandler` - Paginated project listing with filters
- `getProjectHandler` - Get single project by ID
- `createProjectHandler` - Create new project
- `updateProjectHandler` - Update existing project
- `deleteProjectHandler` - Soft delete project

## Middleware

- `loggingMiddleware` - Structured request/response logging
- `errorHandler` - Centralized error handling
- `validateBody/Query/Params` - Request validation
- `rateLimitMiddleware` - Configurable rate limiting
- `corsMiddleware` - CORS handling

## Rate Limiting

- `authRateLimit` - 10 requests per 15 minutes for auth endpoints
- `standardRateLimit` - 100 requests per 15 minutes
- `relaxedRateLimit` - 1000 requests per 15 minutes
- `strictRateLimit` - 5 requests per 15 minutes

## Error Handling

All errors are handled consistently with proper HTTP status codes and structured error responses. The package includes custom error classes for common scenarios:

- `ApiError` - Base API error class
- `ValidationError` - Request validation errors
- `AuthError` - Authentication errors
- `NotFoundError` - Resource not found errors