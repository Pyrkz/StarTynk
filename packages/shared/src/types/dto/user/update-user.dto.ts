import { z } from 'zod';
import { Role } from '../../enums';

/**
 * Update user DTO
 */
export interface UpdateUserDTO {
  name?: string;
  role?: Role;
  phone?: string;
  position?: string;
  department?: string;
  employmentStartDate?: Date | string;
  employmentEndDate?: Date | string;
  isActive?: boolean;
  image?: string;
}

/**
 * Update user validation schema
 */
export const UpdateUserDTOSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.nativeEnum(Role).optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{8,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  position: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  employmentStartDate: z.union([z.date(), z.string()]).optional().nullable(),
  employmentEndDate: z.union([z.date(), z.string()]).optional().nullable(),
  isActive: z.boolean().optional(),
  image: z.string().url('Invalid image URL').optional().nullable(),
});

/**
 * Update profile DTO (for users updating their own profile)
 */
export interface UpdateProfileDTO {
  name?: string;
  phone?: string;
  image?: string;
}

/**
 * Update profile validation schema
 */
export const UpdateProfileDTOSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{8,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  image: z.string().url('Invalid image URL').optional().nullable(),
});