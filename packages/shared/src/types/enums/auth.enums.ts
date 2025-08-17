/**
 * Authentication and authorization related enums
 */

// Re-export Role from database for convenience
export { Role } from '@repo/database';

export enum AuthProvider {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE'
}

export enum LoginMethod {
  EMAIL = 'email',
  PHONE = 'phone'
}

export enum ClientType {
  WEB = 'web',
  MOBILE = 'mobile'
}