import { ProjectStatus } from '../enums';
import { User } from './user.types';

/**
 * Developer model representing construction developers
 */
export interface Developer {
  id: string;
  name: string;
  address: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  projects?: Project[];
}

/**
 * Project model representing construction projects
 */
export interface Project {
  id: string;
  name: string;
  address: string;
  developerId: string;
  startDate: Date | string;
  endDate: Date | string;
  baseRate: number | string; // Decimal as string for precision
  status: ProjectStatus;
  description: string | null;
  createdById: string;
  coordinatorId: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // Relations
  developer?: Developer;
  coordinator?: User;
  createdBy?: User;
  apartments?: Apartment[];
}

/**
 * Apartment model representing units within a project
 */
export interface Apartment {
  id: string;
  projectId: string;
  number: string;
  floor: number | null;
  area: number | string | null; // Decimal as string for precision
  rooms: number | null;
  type: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // Relations
  project?: Project;
}