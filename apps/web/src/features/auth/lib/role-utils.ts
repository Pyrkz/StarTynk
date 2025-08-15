import type { Role } from '@repo/database'

// Hierarchia ról - wyższa wartość = więcej uprawnień
export const roleHierarchy: Record<Role, number> = {
  USER: 1,
  WORKER: 2,
  COORDINATOR: 3,
  MODERATOR: 4,
  ADMIN: 5,
}

// Nazwy ról po polsku
export const roleNames: Record<Role, string> = {
  USER: 'Użytkownik',
  WORKER: 'Pracownik',
  COORDINATOR: 'Koordynator',
  MODERATOR: 'Moderator',
  ADMIN: 'Administrator',
}

// Opisy ról
export const roleDescriptions: Record<Role, string> = {
  USER: 'Podstawowy użytkownik systemu',
  WORKER: 'Pracownik z dostępem do podstawowych funkcji',
  COORDINATOR: 'Koordynator zespołu z rozszerzonymi uprawnieniami',
  MODERATOR: 'Moderator z uprawnieniami do zarządzania użytkownikami',
  ADMIN: 'Administrator z pełnym dostępem do systemu',
}

// Kolory dla ról
export const roleColors: Record<Role, string> = {
  USER: 'bg-gray-100 text-gray-800',
  WORKER: 'bg-blue-100 text-blue-800',
  COORDINATOR: 'bg-green-100 text-green-800',
  MODERATOR: 'bg-yellow-100 text-yellow-800',
  ADMIN: 'bg-red-100 text-red-800',
}

/**
 * Sprawdza czy użytkownik ma wymaganą rolę lub wyższą
 */
export function hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Sprawdza czy użytkownik ma którąkolwiek z wymaganych ról
 */
export function hasAnyRole(userRole: Role, roles: Role[]): boolean {
  return roles.includes(userRole)
}

/**
 * Zwraca listę ról które użytkownik może przypisać innym
 */
export function getAssignableRoles(userRole: Role): Role[] {
  const userLevel = roleHierarchy[userRole]
  
  return Object.entries(roleHierarchy)
    .filter(([_, level]) => level < userLevel)
    .map(([role]) => role as Role)
}

/**
 * Sprawdza czy użytkownik może zarządzać innym użytkownikiem
 */
export function canManageUser(managerRole: Role, targetRole: Role): boolean {
  return roleHierarchy[managerRole] > roleHierarchy[targetRole]
}