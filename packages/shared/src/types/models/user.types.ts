import { Role } from '../enums';

/**
 * User model representing system users
 */
export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | string | null;
  image: string | null;
  password?: string; // Optional, not sent to client
  role: Role;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  invitedBy: string | null;
  deletedAt: Date | string | null;
  department: string | null;
  employmentEndDate: Date | string | null;
  employmentStartDate: Date | string | null;
  lastLoginAt: Date | string | null;
  loginCount: number;
  phone: string | null;
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
  expires: Date | string;
}

/**
 * Verification token for email verification
 */
export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date | string;
}

/**
 * Invitation code for inviting new users
 */
export interface InvitationCode {
  id: string;
  code: string;
  email: string;
  usedAt: Date | string | null;
  expiresAt: Date | string;
  createdAt: Date | string;
  invitedBy: string;
  lastSentAt: Date | string;
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
  createdAt: Date | string;
  user?: User;
}