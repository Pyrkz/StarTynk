import { ProjectStatus } from '../../enums';

/**
 * Create project DTO
 */
export interface CreateProjectDTO {
  name: string;
  address: string;
  developerId: string;
  startDate: string;
  endDate: string;
  baseRate: number;
  status?: ProjectStatus;
  description?: string;
  coordinatorId?: string;
  createdById: string;
}

/**
 * Create project response DTO
 */
export interface CreateProjectResponseDTO {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  createdAt: string;
}

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
 * Developer DTO
 */
export interface DeveloperDTO {
  id: string;
  name: string;
  address?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    projects?: number;
  };
}