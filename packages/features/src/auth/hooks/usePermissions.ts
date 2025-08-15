import { authStore } from '../stores/auth.store';
import { UserRole } from '@repo/shared/types';

export function usePermissions() {
  const { user } = authStore();

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const isAdmin = (): boolean => {
    return hasRole('ADMIN');
  };

  const isCoordinator = (): boolean => {
    return hasRole('COORDINATOR');
  };

  const isEmployee = (): boolean => {
    return hasRole('EMPLOYEE');
  };

  const canAccessAdminPanel = (): boolean => {
    return hasAnyRole(['ADMIN', 'COORDINATOR']);
  };

  const canManageUsers = (): boolean => {
    return hasAnyRole(['ADMIN', 'COORDINATOR']);
  };

  const canManageProjects = (): boolean => {
    return hasAnyRole(['ADMIN', 'COORDINATOR']);
  };

  const canViewReports = (): boolean => {
    return hasAnyRole(['ADMIN', 'COORDINATOR']);
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