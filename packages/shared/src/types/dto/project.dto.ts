import type { Project, Task, Apartment } from '@repo/database';

/**
 * Data Transfer Object for Project entity
 */
export type ProjectDTO = Omit<Project, 'deletedAt'> & {
  /** Developer information */
  developer?: {
    id: string;
    name: string;
    contact?: string;
  };
  /** Coordinator information */
  coordinator?: {
    id: string;
    name: string;
    email: string;
  };
  /** Creator information */
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

/**
 * Project list DTO for table views
 */
export type ProjectListDTO = Pick<Project, 
  'id' | 'name' | 'address' | 'status' | 'startDate' | 'endDate' | 'baseRate'
> & {
  /** Developer name */
  developerName: string;
  /** Coordinator name */
  coordinatorName?: string;
  /** Progress percentage */
  progress?: number;
  /** Task count */
  taskCount?: number;
  /** Completed task count */
  completedTaskCount?: number;
};

/**
 * Project detail DTO with comprehensive information
 */
export type ProjectDetailDTO = ProjectDTO & {
  /** Project statistics */
  stats?: {
    taskCount: number;
    completedTaskCount: number;
    apartmentCount: number;
    totalArea: number;
    progress: number;
    estimatedCompletion: Date;
  };
  /** Recent tasks */
  recentTasks?: Array<{
    id: string;
    title: string;
    status: string;
    assignedTo?: string;
  }>;
};

/**
 * Create project DTO
 */
export type CreateProjectDTO = {
  name: string;
  address: string;
  developerId: string;
  startDate: Date;
  endDate: Date;
  baseRate: number;
  description?: string;
  coordinatorId?: string;
};

/**
 * Update project DTO
 */
export type UpdateProjectDTO = Partial<Omit<CreateProjectDTO, 'developerId'>>;

/**
 * Apartment DTO
 */
export type ApartmentDTO = Omit<Apartment, 'deletedAt'> & {
  /** Task count for this apartment */
  taskCount?: number;
  /** Completed task count */
  completedTaskCount?: number;
  /** Progress percentage */
  progress?: number;
};

/**
 * Task DTO
 */
export type TaskDTO = Omit<Task, 'deletedAt'> & {
  /** Project information */
  project?: {
    id: string;
    name: string;
  };
  /** Apartment information */
  apartment?: {
    id: string;
    number: string;
    floor?: number;
  };
  /** Assigned users */
  assignedUsers?: Array<{
    id: string;
    name: string;
    role?: string;
  }>;
  /** Quality control information */
  qualityControl?: {
    status: string;
    completionRate: number;
    lastControlDate?: Date;
  };
};