# Naming Conventions

This document outlines the naming conventions used throughout the StarTynk monorepo to ensure consistency and maintainability across both web and mobile applications.

## File Naming

### Components
- **Format**: PascalCase
- **Examples**: `UserCard.tsx`, `LoginForm.tsx`, `ProjectList.tsx`
- **Location**: Within `components/` folders in features or global components directory

### Hooks
- **Format**: camelCase with 'use' prefix
- **Examples**: `useAuth.ts`, `useUsers.ts`, `useProjects.ts`
- **Location**: Within `hooks/` folders in features or shared hooks directory

### Services
- **Format**: camelCase with '.service' suffix
- **Examples**: `auth.service.ts`, `users.service.ts`, `projects.service.ts`
- **Location**: Within `services/` folders in features

### Stores
- **Format**: camelCase with '.store' suffix
- **Examples**: `auth.store.ts`, `app.store.ts`, `ui.store.ts`
- **Location**: Within `stores/` folders in features

### Utils
- **Format**: camelCase with '.utils' suffix
- **Examples**: `date.utils.ts`, `format.utils.ts`, `validation.utils.ts`
- **Location**: Within `utils/` folders in features or shared utils directory

### Types
- **Format**: camelCase with '.types' suffix
- **Examples**: `user.types.ts`, `auth.types.ts`, `project.types.ts`
- **Location**: Within `types/` folders in features or global types directory

### Tests
- **Format**: Same as file being tested with '.test' suffix
- **Examples**: `useAuth.test.ts`, `UserCard.test.tsx`, `auth.service.test.ts`
- **Location**: Adjacent to the file being tested

### API Routes (Next.js)
- **Format**: lowercase with hyphens for multi-word
- **Examples**: `route.ts`, `[id]/route.ts`
- **Location**: Within `app/api/` directory following Next.js conventions

## Folder Structure

### Feature-Based Organization
Each feature folder should contain:
```
feature-name/
├── components/     # Feature-specific components
├── hooks/         # Feature-specific hooks
├── services/      # API services
├── stores/        # State management
├── utils/         # Feature-specific utilities
├── types/         # TypeScript types
└── index.ts       # Barrel export
```

### Shared Logic
Shared business logic goes to `packages/features/`:
```
packages/features/src/
├── auth/          # Authentication feature
├── users/         # Users management
├── projects/      # Projects management
└── shared/        # Cross-feature utilities
    ├── hooks/     # Shared hooks
    └── utils/     # Shared utilities
```

### Platform-Specific Code
Platform-specific implementations stay in `apps/`:
- `apps/web/src/features/` - Web-specific feature implementations
- `apps/mobile/src/features/` - Mobile-specific feature implementations

## Export Patterns

### Index Files
Every feature folder should have an `index.ts` for clean imports:
```typescript
// Services
export { authService } from './services/auth.service';

// Hooks
export { useAuth } from './hooks/useAuth';

// Stores
export { authStore } from './stores/auth.store';

// Utils
export * from './utils/auth.validators';
```

### Named vs Default Exports
- **Named exports**: For utilities, hooks, services, and stores
- **Default exports**: For React components only
- **Barrel exports**: For feature modules

## Import Order

Maintain consistent import order:
```typescript
// 1. External libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Workspace packages (@repo/*)
import { UserDTO } from '@repo/shared/types';
import { useAuth } from '@repo/features/auth';

// 3. Absolute imports (@/)
import { Button } from '@/components/ui/button';

// 4. Relative imports (../)
import { formatDate } from '../utils/date.utils';

// 5. Style imports
import styles from './Component.module.css';
```

## TypeScript Conventions

### Interfaces vs Types
- Use `interface` for object shapes that might be extended
- Use `type` for unions, intersections, and utility types

### Naming
- **Interfaces**: PascalCase, no 'I' prefix
- **Types**: PascalCase
- **Enums**: PascalCase with UPPER_SNAKE_CASE values
- **DTOs**: Suffix with 'DTO' (e.g., `UserDTO`, `LoginRequestDTO`)

### Examples:
```typescript
// Interface
interface User {
  id: string;
  email: string;
  role: UserRole;
}

// Type
type UserRole = 'ADMIN' | 'COORDINATOR' | 'EMPLOYEE';

// Enum
enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

// DTO
interface CreateUserDTO {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
```

## Component Conventions

### Component Files
```
ComponentName/
├── ComponentName.tsx      # Main component
├── ComponentName.types.ts # TypeScript types
├── ComponentName.test.tsx # Tests
├── ComponentName.module.css # Styles (if using CSS modules)
└── index.ts              # Barrel export
```

### Props Naming
- Props interfaces should be named `{ComponentName}Props`
- Spread props should be typed explicitly

```typescript
interface UserCardProps {
  user: UserDTO;
  onClick?: () => void;
  className?: string;
}

export function UserCard({ user, onClick, className }: UserCardProps) {
  // Component implementation
}
```

## Function Naming

### Event Handlers
- Prefix with 'handle' or 'on'
- Examples: `handleClick`, `handleSubmit`, `onUserSelect`

### Boolean Functions
- Prefix with 'is', 'has', 'can', or 'should'
- Examples: `isValid`, `hasPermission`, `canEdit`, `shouldUpdate`

### Async Functions
- Consider suffix with 'Async' for clarity when needed
- Examples: `fetchUserAsync`, `saveDataAsync`

## Variable Naming

### Constants
- UPPER_SNAKE_CASE for true constants
- Examples: `MAX_RETRIES`, `API_TIMEOUT`, `DEFAULT_PAGE_SIZE`

### Configuration Objects
- camelCase for configuration objects
- Examples: `defaultConfig`, `apiConfig`, `routerConfig`

### Boolean Variables
- Prefix with 'is', 'has', 'should'
- Examples: `isLoading`, `hasError`, `shouldRefresh`

## CSS/Style Conventions

### CSS Classes (CSS Modules)
- camelCase for CSS module classes
- kebab-case for global CSS classes
- BEM notation for complex components

### Styled Components / Emotion
- PascalCase for styled components
- Prefix with 'Styled' when needed for clarity

```typescript
const StyledButton = styled.button`
  // styles
`;

const Container = styled.div`
  // styles
`;
```

## API Conventions

### Endpoint Naming
- Use RESTful conventions
- Plural for collections: `/users`, `/projects`
- Singular for specific resources: `/users/:id`, `/projects/:id`
- Nested resources: `/projects/:id/users`

### Query Parameters
- camelCase for query parameters
- Examples: `pageSize`, `sortBy`, `filterBy`

## Git Conventions

### Branch Names
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/updates

### Commit Messages
- Use present tense
- Be descriptive but concise
- Reference issue numbers when applicable

## Package Naming

### Workspace Packages
- Prefix with `@repo/`
- Examples: `@repo/shared`, `@repo/features`, `@repo/ui`

### Package.json Scripts
- Use hyphens for multi-word scripts
- Examples: `build-web`, `test-mobile`, `lint-fix`