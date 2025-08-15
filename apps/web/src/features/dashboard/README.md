# Dashboard Feature Module

This module contains all dashboard-related components, hooks, types, and utilities following a feature-based architecture pattern.

## Structure

```
dashboard/
├── components/
│   ├── Header/           # Dashboard header component
│   │   ├── Header.tsx
│   │   ├── Header.types.ts
│   │   └── index.ts
│   ├── DashboardLayout/  # Main layout wrapper
│   │   ├── DashboardLayout.tsx
│   │   ├── DashboardLayout.types.ts
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── useNotifications.ts  # Notifications management
│   ├── useSearch.ts        # Search functionality
│   └── index.ts
├── types/
│   ├── dashboard.types.ts  # Shared types
│   └── index.ts
├── utils/
│   ├── dashboard.utils.ts  # Helper functions
│   └── index.ts
└── index.ts
```

## Usage

### Basic Usage

```tsx
import { DashboardLayout } from '@/features/dashboard'

export default function MyPage() {
  return (
    <DashboardLayout
      pageTitle="My Page"
      showSearch={true}
      notificationCount={5}
    >
      {/* Page content */}
    </DashboardLayout>
  )
}
```

### With Breadcrumbs

```tsx
import { DashboardLayout, createBreadcrumbs } from '@/features/dashboard'

const breadcrumbs = createBreadcrumbs([
  { label: 'Section', href: '/dashboard/section' },
  { label: 'Current Page' }
])

export default function MyPage() {
  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {/* Page content */}
    </DashboardLayout>
  )
}
```

### Using Hooks

```tsx
import { useSearch, useNotifications } from '@/features/dashboard'

function MyComponent() {
  const { searchQuery, handleSearch } = useSearch()
  const { notifications, unreadCount } = useNotifications()
  
  // Use in your component
}
```

## Components

### Header
The main dashboard header component with:
- Mobile menu toggle
- Page title/breadcrumbs display
- Optional search bar
- Notifications badge
- User profile dropdown
- Sticky positioning with blur effect

### DashboardLayout
The main layout wrapper that combines:
- Sidebar navigation (from navigation feature)
- Header component
- Main content area
- Mobile responsive behavior

## Hooks

### useSearch
Manages search functionality:
- `searchQuery`: Current search input
- `setSearchQuery`: Update search input
- `handleSearch`: Submit handler
- `clearSearch`: Clear search input

### useNotifications
Manages notifications state:
- `notifications`: Array of notification objects
- `unreadCount`: Number of unread notifications
- `markAsRead`: Mark single notification as read
- `markAllAsRead`: Mark all as read
- `deleteNotification`: Remove a notification
- `clearAll`: Clear all notifications

## Utils

### createBreadcrumbs
Helper to create breadcrumb arrays with Dashboard as the base.

### generatePageTitle
Generate page title from pathname.

### formatNotificationCount
Format notification count for display (99+).