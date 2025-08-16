# React Hooks & State Management Migration Guide

## Overview

This guide explains how to migrate from scattered auth hooks and state management to the unified system in `@repo/features`.

## What's Changed

### Before (Scattered Implementation)
```
apps/mobile/src/features/auth/hooks/useAuth.ts
apps/mobile/src/features/auth/context/AuthContext.tsx
apps/web/src/features/auth/hooks/useAuth.ts
apps/web/src/contexts/AuthContext.tsx
```

### After (Unified Implementation)
```
packages/features/src/auth/store/auth.store.ts     # Zustand store
packages/features/src/auth/hooks/useAuth.ts        # Core hook
packages/features/src/auth/hooks/useAuthGuard.ts   # Route protection
packages/features/src/auth/hooks/useAuthForm.ts    # Form handling
```

## Migration Steps

### 1. Update Imports

#### Mobile App
```typescript
// OLD
import { useAuth } from '@/src/features/auth';
import { AuthContext } from '@/src/features/auth/context';

// NEW
import { useMobileAuth as useAuth } from '@repo/features';
// OR for basic usage:
import { useAuth } from '@repo/features';
```

#### Web App
```typescript
// OLD
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthContext } from '@/contexts/AuthContext';

// NEW
import { useWebAuth as useAuth } from '@repo/features';
// OR for basic usage:
import { useAuth } from '@repo/features';
```

### 2. Update Auth Usage

#### Basic Authentication
```typescript
// The interface is mostly the same
const { user, isAuthenticated, login, logout } = useAuth();

// Login now uses unified types
await login({
  identifier: 'user@example.com',
  password: 'password',
  loginMethod: 'email',
  rememberMe: true
});
```

#### Route Protection
```typescript
// NEW: Use the auth guard hook
import { useAuthGuard } from '@repo/features';

function ProtectedComponent() {
  const { isAuthorized, isLoading } = useAuthGuard({
    requireAuth: true,
    allowedRoles: ['ADMIN', 'MANAGER'],
    onUnauthenticated: () => router.push('/login'),
    onUnauthorized: () => router.push('/403')
  });

  if (isLoading) return <Loading />;
  if (!isAuthorized) return null;
  
  return <YourComponent />;
}
```

#### Form Handling
```typescript
// NEW: Use the auth form hook
import { useAuthForm } from '@repo/features';

function LoginForm() {
  const { 
    handleLogin, 
    validationErrors, 
    isLoginLoading 
  } = useAuthForm();

  const onSubmit = async (data) => {
    const result = await handleLogin({
      identifier: data.email,
      password: data.password,
      loginMethod: 'email',
      rememberMe: data.rememberMe
    });

    if (result.success) {
      // Navigate to dashboard
    }
  };
}
```

### 3. Platform-Specific Features

#### Mobile Biometric Auth
```typescript
// The mobile auth hook includes biometric methods
const { biometricLogin, checkBiometricAvailability } = useAuth();

const biometricStatus = await checkBiometricAvailability();
if (biometricStatus.available) {
  const success = await biometricLogin();
}
```

#### Web NextAuth Integration
```typescript
// The web auth hook includes NextAuth methods
const { session, signIn, signOut } = useAuth();

// Can still use NextAuth methods
await signIn('credentials', { email, password });
```

### 4. State Management

#### Direct Store Access
```typescript
// For fine-grained state access
import { useAuthUser, useIsAuthenticated, useAuthLoading } from '@repo/features';

const user = useAuthUser();
const isAuthenticated = useIsAuthenticated();
const { isLoginLoading } = useAuthLoading();
```

#### Store Actions
```typescript
// Access store directly when needed
import { useAuthStore } from '@repo/features';

const setError = useAuthStore(state => state.setError);
setError('Custom error message');
```

## Benefits of Migration

1. **Single Source of Truth**: One auth implementation for both platforms
2. **Type Safety**: Unified types across the entire monorepo
3. **Better Performance**: Zustand with persistence and selective subscriptions
4. **Offline Support**: Built-in offline handling for mobile
5. **Easier Testing**: One set of hooks to test
6. **Consistent Behavior**: Same auth flow on web and mobile

## Gradual Migration

You can migrate gradually by:

1. Start with new features using unified hooks
2. Keep existing code working with legacy imports
3. Migrate component by component
4. Remove old implementations once fully migrated

## Example: Complete Login Screen Migration

### Before (Mobile)
```typescript
import { useAuth } from '@/src/features/auth';
import authService from '@/src/features/auth/services/authService';

function LoginScreen() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      await authService.login({ email, password });
      router.push('/home');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };
}
```

### After (Mobile)
```typescript
import { useAuth, useAuthForm } from '@repo/features';

function LoginScreen() {
  const { handleLogin, isLoginLoading, validationErrors } = useAuthForm();
  const router = useRouter();
  
  const onSubmit = async (data) => {
    const result = await handleLogin({
      identifier: data.email,
      password: data.password,
      loginMethod: 'email',
      rememberMe: true
    });
    
    if (result.success) {
      router.push('/home');
    }
  };
  
  // Validation errors are handled automatically
  // Loading state is managed by the hook
}
```

## Troubleshooting

### TypeScript Errors
```bash
# Ensure features package is built
cd packages/features && npm run build
```

### Import Errors
```bash
# Check that @repo/features is in your dependencies
npm list @repo/features
```

### State Not Persisting
- Check that storage is properly initialized
- Ensure Zustand persistence middleware is working
- Verify platform detection is correct

## Next Steps

1. Start with one component/screen
2. Test thoroughly
3. Migrate related components
4. Remove old auth implementation
5. Update tests to use new hooks