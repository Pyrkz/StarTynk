import { Role } from '../../enums';

/**
 * Create user DTO
 */
export interface CreateUserDTO {
  email?: string;
  phone?: string;
  password: string;
  name?: string;
  role?: Role;
  position?: string;
  department?: string;
  employmentStartDate?: string;
  sendInvitation?: boolean;
}

/**
 * Bulk create users DTO
 */
export interface BulkCreateUsersDTO {
  users: CreateUserDTO[];
  sendInvitations?: boolean;
}

/**
 * Create user response DTO
 */
export interface CreateUserResponseDTO {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  role: Role;
  invitationSent?: boolean;
}

/**
 * Invite user DTO
 */
export interface InviteUserDTO {
  email: string;
  role: Role;
  message?: string;
}

/**
 * Bulk invite users DTO
 */
export interface BulkInviteUsersDTO {
  invitations: InviteUserDTO[];
}

/**
 * Invitation response DTO
 */
export interface InvitationResponseDTO {
  id: string;
  email: string;
  role: Role;
  code: string;
  expiresAt: string;
  sentAt: string;
}