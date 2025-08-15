# Feature-Based Architecture

This directory follows a feature-based architecture pattern that groups related functionality together.

## Structure

```
/features/
├── dashboard/           # Dashboard feature module
│   ├── components/      # Feature-specific components
│   ├── hooks/          # Feature-specific hooks
│   ├── types/          # Feature-specific types
│   ├── utils/          # Feature-specific utilities
│   └── index.ts        # Feature exports
├── navigation/         # Navigation feature module
│   └── ...
└── index.ts           # Root exports
```

## Benefits

1. **Scalability**: Easy to add new features without cluttering the codebase
2. **Discoverability**: Related code is grouped together
3. **Maintainability**: Clear boundaries between features
4. **Reusability**: Shared components remain in `/components/ui/`
5. **Type Safety**: Feature-specific types prevent pollution

## Usage

Import from feature modules:
```typescript
import { DashboardLayout, Header, useNotifications } from "@/features/dashboard";
import { Sidebar } from "@/features/navigation";
```

Or use the root export:
```typescript
import { DashboardLayout, Sidebar } from "@/features";
```

## Adding New Features

1. Create a new directory under `/features/`
2. Follow the same structure (components, hooks, types, utils)
3. Export through index files
4. Add to the root `/features/index.ts`

## Shared Components

UI components that are used across multiple features should remain in `/components/ui/`.