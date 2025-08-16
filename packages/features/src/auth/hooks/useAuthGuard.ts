import { useEffect } from 'react';
import { useAuth } from './useAuth';
import type { Role } from '@repo/shared/types';

export interface AuthGuardOptions {
  requireAuth?: boolean;
  allowedRoles?: Role[];
  redirectTo?: string;
  onUnauthorized?: () => void;
  onUnauthenticated?: () => void;
}

/**
 * Auth guard hook for protecting routes/components
 * Works across web and mobile platforms
 */
export function useAuthGuard(options: AuthGuardOptions = {}) {
  const {
    requireAuth = true,
    allowedRoles,
    onUnauthorized,
    onUnauthenticated,
  } = options;

  const { user, isAuthenticated, isLoading } = useAuth();

  const hasPermission = () => {
    if (!requireAuth) return true;
    if (!isAuthenticated) return false;
    if (!user) return false;
    
    if (allowedRoles && allowedRoles.length > 0) {
      return allowedRoles.includes(user.role);
    }
    
    return true;
  };

  const isAuthorized = hasPermission();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      onUnauthenticated?.();
      return;
    }

    if (isAuthenticated && !isAuthorized) {
      onUnauthorized?.();
      return;
    }
  }, [isAuthenticated, isAuthorized, isLoading, requireAuth, onUnauthenticated, onUnauthorized]);

  return {
    isAuthorized,
    isLoading,
    hasPermission,
    user,
    isAuthenticated,
  };
}