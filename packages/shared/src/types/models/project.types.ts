import type { 
  ProjectStatus, 
  TaskStatus, 
  TaskPriority, 
  QualityStatus, 
  QualityIssueType,
  PhotoType,
  material_orders_status,
  PaymentStatus
} from '@repo/database';

/**
 * Developer/Client model
 */
export interface Developer {
  id: string;
  name: string;
  address: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Project model
 */
export interface Project {
  /** Unique identifier */
  id: string;
  
  /** Project name */
  name: string;
  
  /** Project address */
  address: string;
  
  /** Developer/Client ID */
  developerId: string;
  
  /** Project start date */
  startDate: Date;
  
  /** Project end date */
  endDate: Date;
  
  /** Base rate for calculations */
  baseRate: number;
  
  /** Current project status */
  status: ProjectStatus;
  
  /** Project description */
  description: string | null;
  
  /** ID of user who created the project */
  createdById: string;
  
  /** ID of project coordinator */
  coordinatorId: string | null;
  
  /** Whether the project is active */
  isActive: boolean;
  
  /** ISO 8601 timestamp of creation */
  createdAt: Date;
  
  /** ISO 8601 timestamp of last update */
  updatedAt: Date;
  
  /** Soft delete timestamp */
  deletedAt: Date | null;
}

/**
 * Apartment model within a project
 */
export interface Apartment {
  id: string;
  projectId: string;
  number: string;
  floor: number | null;
  area: number | null;
  rooms: number | null;
  type: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Task model
 */
export interface Task {
  /** Unique identifier */
  id: string;
  
  /** Project ID this task belongs to */
  projectId: string;
  
  /** Apartment ID if task is apartment-specific */
  apartmentId: string | null;
  
  /** Task title */
  title: string;
  
  /** Task description */
  description: string | null;
  
  /** Task area in square meters */
  area: number;
  
  /** Rate per unit */
  rate: number;
  
  /** Current task status */
  status: TaskStatus;
  
  /** Estimated hours to complete */
  estimatedHours: number | null;
  
  /** Actual hours worked */
  actualHours: number | null;
  
  /** Task priority */
  priority: TaskPriority;
  
  /** Due date */
  dueDate: Date | null;
  
  /** Whether the task is active */
  isActive: boolean;
  
  /** ISO 8601 timestamp of creation */
  createdAt: Date;
  
  /** ISO 8601 timestamp of last update */
  updatedAt: Date;
  
  /** Soft delete timestamp */
  deletedAt: Date | null;
}

/**
 * Task assignment model
 */
export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  role: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Quality control model
 */
export interface QualityControl {
  /** Unique identifier */
  id: string;
  
  /** Task ID being controlled */
  taskId: string;
  
  /** ID of user performing control */
  controllerId: string;
  
  /** Control number (1st, 2nd, etc.) */
  controlNumber: number;
  
  /** Quality status */
  status: QualityStatus;
  
  /** Completion rate percentage */
  completionRate: number;
  
  /** Control notes */
  notes: string | null;
  
  /** Issues found description */
  issuesFound: string | null;
  
  /** Corrections needed description */
  correctionsNeeded: string | null;
  
  /** Date of control */
  controlDate: Date;
  
  /** Date of re-control if needed */
  recontrolDate: Date | null;
  
  /** Type of issue if any */
  issueType: QualityIssueType | null;
  
  /** Whether the control is active */
  isActive: boolean;
  
  /** ISO 8601 timestamp of creation */
  createdAt: Date;
  
  /** ISO 8601 timestamp of last update */
  updatedAt: Date;
  
  /** Soft delete timestamp */
  deletedAt: Date | null;
}

/**
 * Photo model for documentation
 */
export interface Photo {
  id: string;
  url: string;
  description: string | null;
  type: PhotoType;
  entityType: string;
  entityId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Comment model for any entity
 */
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  entityType: string;
  entityId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment calculation model
 */
export interface PaymentCalculation {
  id: string;
  taskId: string;
  area: number;
  rate: number;
  completionRate: number;
  amount: number;
  isPaid: boolean;
  paidAt: Date | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project assignment model
 */
export interface ProjectAssignment {
  id: string;
  userId: string;
  projectId: string;
  assignedDate: Date;
  unassignedDate: Date | null;
  role: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}