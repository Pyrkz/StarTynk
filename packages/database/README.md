# @repo/database

This package provides Prisma database client and types for the StarTynk application.

## Usage

### Server-side (API routes, server components)

```typescript
// Import Prisma client and types
import { prisma } from '@repo/database';
import { User, Role } from '@repo/database';

// Use Prisma client
const users = await prisma.user.findMany();
```

### Client-side (Client components, browser code)

```typescript
// Import only types (no Prisma Client runtime)
import { User, Role } from '@repo/database/client-types';

// Use types for props, state, etc.
interface Props {
  user: User;
  role: Role;
}
```

## Why separate exports?

Prisma Client requires Node.js-specific modules like `child_process` and `async_hooks` that don't exist in the browser environment. To use Prisma-generated types in client components without importing the runtime, we provide a separate export path that contains only the TypeScript types.

## Exports

- `@repo/database` - Full Prisma Client and types (server-side only)
- `@repo/database/client-types` - Types only (safe for client-side)