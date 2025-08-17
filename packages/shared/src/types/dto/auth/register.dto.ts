import { Role, LoginMethod } from '../../enums';
import type { UserDTO } from '../user';

/**
 * Registration request DTO
 */
export interface RegisterRequestDTO {
  email?: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
  name: string;
  position?: string;
  department?: string;
  invitationCode?: string;
  loginMethod?: LoginMethod;
}

/**
 * Registration response DTO
 */
export interface RegisterResponseDTO {
  success: boolean;
  user: UserDTO;
  message: string;
  requiresVerification: boolean;
}

/**
 * Verify account request DTO
 */
export interface VerifyAccountRequestDTO {
  token: string;
  code?: string;
}

/**
 * Verify account response DTO
 */
export interface VerifyAccountResponseDTO {
  success: boolean;
  message: string;
  user?: UserDTO;
}

/**
 * Invitation validation DTO
 */
export interface ValidateInvitationDTO {
  code: string;
}

/**
 * Invitation validation response DTO
 */
export interface ValidateInvitationResponseDTO {
  valid: boolean;
  email?: string;
  role?: Role;
  expiresAt?: string;
  message?: string;
}

/**
 * Reset password request DTO
 */
export interface ResetPasswordRequestDTO {
  identifier: string; // email or phone
  method?: LoginMethod;
}

/**
 * Reset password response DTO
 */
export interface ResetPasswordResponseDTO {
  success: boolean;
  message: string;
  method: 'email' | 'sms';
}

/**
 * Reset password confirm DTO
 */
export interface ResetPasswordConfirmDTO {
  token: string;
  newPassword: string;
  confirmPassword?: string;
}

/**
 * Reset password confirm response DTO
 */
export interface ResetPasswordConfirmResponseDTO {
  success: boolean;
  message: string;
}