import { z } from 'zod';
import { ProjectStatus } from '../../enums';

/**
 * Update project DTO
 */
export interface UpdateProjectDTO {
  name?: string;
  address?: string;
  developerId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  baseRate?: number;
  status?: ProjectStatus;
  description?: string;
  coordinatorId?: string | null;
  isActive?: boolean;
}

/**
 * Update project validation schema
 */
export const UpdateProjectDTOSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').optional(),
  address: z.string().min(5, 'Address must be at least 5 characters').optional(),
  developerId: z.string().optional(),
  startDate: z.union([z.date(), z.string()]).optional(),
  endDate: z.union([z.date(), z.string()]).optional(),
  baseRate: z.number().positive('Base rate must be positive').optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  coordinatorId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

/**
 * Update developer DTO
 */
export interface UpdateDeveloperDTO {
  name?: string;
  address?: string;
  contact?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

/**
 * Update developer validation schema
 */
export const UpdateDeveloperDTOSchema = z.object({
  name: z.string().min(2, 'Developer name must be at least 2 characters').optional(),
  address: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  email: z.string().email('Invalid email format').optional().nullable(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{8,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

/**
 * Update apartment DTO
 */
export interface UpdateApartmentDTO {
  number?: string;
  floor?: number;
  area?: number;
  rooms?: number;
  type?: string;
  isActive?: boolean;
}

/**
 * Update apartment validation schema
 */
export const UpdateApartmentDTOSchema = z.object({
  number: z.string().min(1, 'Apartment number is required').optional(),
  floor: z.number().int().min(0).optional().nullable(),
  area: z.number().positive('Area must be positive').optional().nullable(),
  rooms: z.number().int().positive('Rooms must be positive').optional().nullable(),
  type: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});