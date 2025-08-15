import { z } from 'zod';
import { Role } from '../../enums';

/**
 * Create user DTO
 */
export interface CreateUserDTO {
  email: string;
  name: string;
  role: Role;
  phone?: string;
  position?: string;
  department?: string;
  employmentStartDate?: Date | string;
  employmentEndDate?: Date | string;
  password?: string; // Optional, can be set later
}

/**
 * Create user validation schema
 */
export const CreateUserDTOSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(Role),
  phone: z.string()
    .regex(/^\+?[1-9]\d{8,14}$/, 'Invalid phone number')
    .optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  employmentStartDate: z.union([z.date(), z.string()]).optional(),
  employmentEndDate: z.union([z.date(), z.string()]).optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
});

/**
 * Invite user DTO
 */
export interface InviteUserDTO {
  email: string;
  role: Role;
  message?: string;
}

/**
 * Invite user validation schema
 */
export const InviteUserDTOSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.nativeEnum(Role),
  message: z.string().max(500, 'Message too long').optional(),
});

/**
 * Bulk invite users DTO
 */
export interface BulkInviteUsersDTO {
  invitations: InviteUserDTO[];
}

/**
 * Bulk invite validation schema
 */
export const BulkInviteUsersDTOSchema = z.object({
  invitations: z.array(InviteUserDTOSchema)
    .min(1, 'At least one invitation required')
    .max(50, 'Maximum 50 invitations at once'),
});