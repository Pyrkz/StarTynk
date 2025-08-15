import type { Role } from '@repo/database';

/**
 * User model representing system users
 * Based on Prisma User model but with proper typing
 */
export interface User {
  /** Unique identifier */
  id: string;
  
  /** User's full name */
  name: string | null;
  
  /** User's email address - unique */
  email: string;
  
  /** Email verification timestamp */
  emailVerified: Date | null;
  
  /** Profile image URL */
  image: string | null;
  
  /** User's role in the system */
  role: Role;
  
  /** Whether the user account is active */
  isActive: boolean;
  
  /** ISO 8601 timestamp of account creation */
  createdAt: Date;
  
  /** ISO 8601 timestamp of last update */
  updatedAt: Date;
  
  /** ID of user who invited this user */
  invitedBy: string | null;
  
  /** Soft delete timestamp */
  deletedAt: Date | null;
  
  /** Department the user belongs to */
  department: string | null;
  
  /** Employment end date */
  employmentEndDate: Date | null;
  
  /** Employment start date */
  employmentStartDate: Date | null;
  
  /** Last login timestamp */
  lastLoginAt: Date | null;
  
  /** Number of times user has logged in */
  loginCount: number;
  
  /** User's phone number */
  phone: string | null;
  
  /** User's position/job title */
  position: string | null;
}

/**
 * Account model for OAuth providers
 */
export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
}

/**
 * Session model for user sessions
 */
export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}

/**
 * Verification token for email verification
 */
export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

/**
 * Invitation code for inviting new users
 */
export interface InvitationCode {
  id: string;
  code: string;
  email: string;
  usedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: string;
  lastSentAt: Date;
  message: string | null;
  resendCount: number;
  role: Role;
  inviter?: User;
}

/**
 * User activity log for tracking user actions
 */
export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: User;
}

/**
 * Refresh token for authentication
 */
export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  deviceId: string | null;
  userAgent: string | null;
  ip: string | null;
  loginMethod: string | null;
}