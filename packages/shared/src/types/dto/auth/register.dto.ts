import { z } from 'zod';
import { Role } from '../../enums';

/**
 * Registration request DTO
 */
export interface RegisterDTO {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone?: string;
  position?: string;
  department?: string;
  invitationCode?: string;
}

/**
 * Registration validation schema
 */
export const RegisterDTOSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{8,14}$/, 'Invalid phone number')
    .optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  invitationCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * Invitation validation DTO
 */
export interface ValidateInvitationDTO {
  code: string;
}

/**
 * Invitation validation schema
 */
export const ValidateInvitationDTOSchema = z.object({
  code: z.string().min(1, 'Invitation code is required'),
});

/**
 * Change password DTO
 */
export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change password validation schema
 */
export const ChangePasswordDTOSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ['newPassword'],
});

/**
 * Reset password request DTO
 */
export interface ResetPasswordRequestDTO {
  email: string;
}

/**
 * Reset password request validation schema
 */
export const ResetPasswordRequestDTOSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * Reset password DTO
 */
export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Reset password validation schema
 */
export const ResetPasswordDTOSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});