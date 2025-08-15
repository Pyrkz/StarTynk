import { UserRole } from '@repo/shared/types';

export const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  COORDINATOR: 'Koordynator',
  EMPLOYEE: 'Pracownik',
};

export function getRoleLabel(role: UserRole): string {
  return roleLabels[role] || role;
}

export function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() < exp;
  } catch {
    return false;
  }
}

export function getTokenPayload<T = any>(token: string): T | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function getTokenExpiration(token: string): Date | null {
  const payload = getTokenPayload<{ exp: number }>(token);
  if (!payload?.exp) return null;
  return new Date(payload.exp * 1000);
}

export function getTokenTimeToExpiration(token: string): number {
  const expiration = getTokenExpiration(token);
  if (!expiration) return 0;
  return Math.max(0, expiration.getTime() - Date.now());
}

export function shouldRefreshToken(token: string, bufferMinutes = 5): boolean {
  const timeToExpiration = getTokenTimeToExpiration(token);
  const bufferMs = bufferMinutes * 60 * 1000;
  return timeToExpiration > 0 && timeToExpiration < bufferMs;
}