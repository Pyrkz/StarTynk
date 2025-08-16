# @repo/trpc

tRPC server configuration and routers for the StarTynk monorepo. This package provides type-safe API endpoints with authentication, validation, and comprehensive CRUD operations for all major entities.

## Features

- **Type-safe API**: Full TypeScript support with automatic type inference
- **Authentication**: JWT and session-based auth with role-based access control
- **Validation**: Zod schema validation with detailed error messages
- **Error handling**: Structured error responses with proper HTTP status codes
- **Middleware**: Comprehensive middleware system for auth, validation, logging, and caching
- **Database integration**: Direct Prisma integration with transaction support

## Routers

### Auth Router (`auth`)
- `login` - Unified login supporting email/phone
- `register` - User registration 
- `refreshToken` - JWT token refresh
- `me` - Get current user session
- `logout` - User logout
- `verifyToken` - Token validation
- `sendOtp` / `verifyOtp` - OTP functionality (planned)

### User Router (`user`)
- `list` - List users with filtering and pagination
- `getById` - Get user details
- `create` - Create new user (Admin only)
- `update` - Update user information
- `delete` - Soft delete user (Admin only)
- `changePassword` - Change user password
- `getStats` - User statistics

### Project Router (`project`)
- `list` - List projects with filtering
- `getById` - Get project with details
- `create` - Create new project
- `update` - Update project
- `delete` - Soft delete project
- `addApartment` - Add apartment to project
- `assignUser` - Assign user to project
- `getStats` - Project statistics

### Task Router (`task`)
- `list` - List tasks with filtering
- `getById` - Get task details
- `create` - Create new task
- `update` - Update task
- `delete` - Soft delete task
- `assignUser` - Assign user to task
- `createQualityControl` - Add quality control
- `createPayment` - Create payment calculation
- `markPaid` - Mark payment as paid
- `getStats` - Task statistics

### Vehicle Router (`vehicle`)
- `list` - List vehicles with filtering
- `getById` - Get vehicle details
- `create` - Create new vehicle
- `update` - Update vehicle
- `delete` - Soft delete vehicle
- `assignVehicle` - Assign vehicle to user
- `addMaintenance` - Add maintenance record
- `createReminder` - Create maintenance reminder
- `getStats` - Vehicle statistics
- `getUpcomingReminders` - Upcoming maintenance reminders

## Usage

### Basic Setup

```typescript
import { appRouter, createContext } from '@repo/trpc';
import { createNextApiHandler } from '@trpc/server/adapters/next';

// Next.js API route
export default createNextApiHandler({
  router: appRouter,
  createContext,
});
```

### Client Usage

```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@repo/trpc';

const trpc = createTRPCReact<AppRouter>();

// In your component
const { data: projects } = trpc.project.list.useQuery({
  page: 1,
  limit: 10,
  status: 'ACTIVE'
});
```

### Authentication

The package provides multiple authentication methods:

1. **JWT Tokens** (for mobile/API clients)
```typescript
// Include in Authorization header
Authorization: Bearer <jwt_token>
```

2. **Session Cookies** (for web clients)
```typescript
// Automatically handled by browser
Cookie: session=<session_token>
```

### Role-Based Access Control

- **USER**: Basic access, can view own data
- **WORKER**: Can view assigned projects/tasks/vehicles
- **COORDINATOR**: Can manage projects and assignments
- **MODERATOR**: Can manage users and all resources
- **ADMIN**: Full system access

### Error Handling

All procedures return structured errors:

```typescript
{
  success: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    details?: any
  },
  timestamp: string,
  requestId?: string
}
```

### Middleware

The package includes several built-in middleware:

- `authMiddleware` - Authentication and user context
- `validationMiddleware` - Input validation
- `loggingMiddleware` - Request/response logging
- `rateLimitMiddleware` - Rate limiting
- `cacheMiddleware` - Response caching
- `transactionMiddleware` - Database transactions

## Development

```bash
# Build the package
npm run build

# Watch for changes
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

## Dependencies

- `@trpc/server` - tRPC server
- `superjson` - Serialization
- `zod` - Validation schemas
- `@repo/database` - Prisma client
- `@repo/shared` - Shared types and utilities
- `@repo/auth` - Authentication services

## TypeScript

The package is fully typed and exports the `AppRouter` type for client-side type inference:

```typescript
import type { AppRouter } from '@repo/trpc';
```

This ensures complete type safety between your server and client applications.