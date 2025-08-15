import { ProjectStatus } from '../../enums';

/**
 * Update project DTO
 */
export interface UpdateProjectDTO {
  name?: string;
  address?: string;
  developerId?: string;
  startDate?: string;
  endDate?: string;
  baseRate?: number;
  status?: ProjectStatus;
  description?: string | null;
  coordinatorId?: string | null;
  isActive?: boolean;
}

/**
 * Update project response DTO
 */
export interface UpdateProjectResponseDTO {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  updatedAt: string;
}

/**
 * Update developer DTO
 */
export interface UpdateDeveloperDTO {
  name?: string;
  address?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
}