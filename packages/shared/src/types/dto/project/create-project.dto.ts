import { z } from 'zod';
import { ProjectStatus } from '../../enums';

/**
 * Create project DTO
 */
export interface CreateProjectDTO {
  name: string;
  address: string;
  developerId: string;
  startDate: Date | string;
  endDate: Date | string;
  baseRate: number;
  status?: ProjectStatus;
  description?: string;
  coordinatorId?: string;
}

/**
 * Create project validation schema
 */
export const CreateProjectDTOSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  developerId: z.string().min(1, 'Developer is required'),
  startDate: z.union([z.date(), z.string()]),
  endDate: z.union([z.date(), z.string()]),
  baseRate: z.number().positive('Base rate must be positive'),
  status: z.nativeEnum(ProjectStatus).optional().default(ProjectStatus.PLANNING),
  description: z.string().max(1000, 'Description too long').optional(),
  coordinatorId: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

/**
 * Create developer DTO
 */
export interface CreateDeveloperDTO {
  name: string;
  address?: string;
  contact?: string;
  email?: string;
  phone?: string;
}

/**
 * Create developer validation schema
 */
export const CreateDeveloperDTOSchema = z.object({
  name: z.string().min(2, 'Developer name must be at least 2 characters'),
  address: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{8,14}$/, 'Invalid phone number')
    .optional(),
});

/**
 * Create apartment DTO
 */
export interface CreateApartmentDTO {
  projectId: string;
  number: string;
  floor?: number;
  area?: number;
  rooms?: number;
  type?: string;
}

/**
 * Create apartment validation schema
 */
export const CreateApartmentDTOSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  number: z.string().min(1, 'Apartment number is required'),
  floor: z.number().int().min(0).optional(),
  area: z.number().positive('Area must be positive').optional(),
  rooms: z.number().int().positive('Rooms must be positive').optional(),
  type: z.string().optional(),
});