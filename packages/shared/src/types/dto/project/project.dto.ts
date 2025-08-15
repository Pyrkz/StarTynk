import { ProjectStatus } from '../../enums';
import { UserListItemDTO } from '../user';
import { ApartmentDTO } from './apartment.dto';
import { TaskListItemDTO } from './task.dto';

export interface ProjectDTO {
  id: string;
  name: string;
  address: string;
  developerId: string;
  developer?: {
    id: string;
    name: string;
  };
  startDate: string;
  endDate: string;
  baseRate: number;
  status: ProjectStatus;
  description?: string | null;
  coordinatorId?: string | null;
  coordinator?: UserListItemDTO;
  createdById: string;
  createdBy?: UserListItemDTO;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks?: number;
    apartments?: number;
    materialOrders?: number;
    deliveries?: number;
  };
}

export interface ProjectListItemDTO {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  developer?: string;
  coordinator?: string;
  _count?: {
    tasks?: number;
    apartments?: number;
  };
}

export interface ProjectDetailDTO extends ProjectDTO {
  apartments?: ApartmentDTO[];
  recentTasks?: TaskListItemDTO[];
  statistics?: ProjectStatisticsDTO;
}

export interface ProjectStatisticsDTO {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalApartments: number;
  totalArea: number;
  estimatedValue: number;
  completionPercentage: number;
}