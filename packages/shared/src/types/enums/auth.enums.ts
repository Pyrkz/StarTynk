/**
 * Authentication and authorization related enums
 */

// Sync with Prisma schema enums
export enum Role {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  COORDINATOR = 'COORDINATOR',
  USER = 'USER',
  WORKER = 'WORKER'
}

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