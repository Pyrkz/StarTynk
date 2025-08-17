import { authStore } from '../stores/auth.store';
import { Role } from '@repo/shared/types';

export function usePermissions() {
  const { user } = authStore();

  const hasRole = (role: Role): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const isAdmin = (): boolean => {
    return hasRole(Role.ADMIN);
  };

  const isCoordinator = (): boolean => {
    return hasRole(Role.COORDINATOR);
  };

  const isEmployee = (): boolean => {
    return hasRole(Role.WORKER);
  };

  const canAccessAdminPanel = (): boolean => {
    return hasAnyRole([Role.ADMIN, Role.COORDINATOR]);
  };

  const canManageUsers = (): boolean => {
    return hasAnyRole([Role.ADMIN, Role.COORDINATOR]);
  };

  const canManageProjects = (): boolean => {
    return hasAnyRole([Role.ADMIN, Role.COORDINATOR]);
  };

  const canViewReports = (): boolean => {
    return hasAnyRole([Role.ADMIN, Role.COORDINATOR]);
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    isCoordinator,
    isEmployee,
    canAccessAdminPanel,
    canManageUsers,
    canManageProjects,
    canViewReports,
  };
}