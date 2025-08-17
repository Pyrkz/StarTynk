import { Role } from '../../enums';

/**
 * Update user DTO
 */
export interface UpdateUserDTO {
  email?: string | null;
  name?: string;
  role?: Role;
  phone?: string | null;
  position?: string | null;
  department?: string | null;
  employmentStartDate?: string | null;
  employmentEndDate?: string | null;
  isActive?: boolean;
  image?: string | null;
  password?: string;
}

/**
 * Update profile DTO (for users updating their own profile)
 */
export interface UpdateProfileDTO {
  name?: string;
  phone?: string | null;
  image?: string | null;
}

/**
 * Change password DTO
 */
export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

/**
 * Reset password DTO
 */
export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

/**
 * Update user response DTO
 */
export interface UpdateUserResponseDTO {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  role: Role;
  updatedAt: string;
}