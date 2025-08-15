import { TaskStatus, TaskPriority, QualityStatus, QualityIssueType } from '../enums';
import { User } from './user.types';
import { Project, Apartment } from './project.types';

/**
 * Task model representing work tasks
 */
export interface Task {
  id: string;
  projectId: string;
  apartmentId: string | null;
  title: string;
  description: string | null;
  area: number | string; // Decimal as string for precision
  rate: number | string; // Decimal as string for precision
  status: TaskStatus;
  estimatedHours: number | null;
  actualHours: number | null;
  priority: TaskPriority;
  dueDate: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // Relations
  project?: Project;
  apartment?: Apartment;
  assignments?: TaskAssignment[];
  qualityControls?: QualityControl[];
  payments?: PaymentCalculation[];
}

/**
 * Task assignment linking users to tasks
 */
export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  role: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  task?: Task;
  user?: User;
}

/**
 * Quality control for tasks
 */
export interface QualityControl {
  id: string;
  taskId: string;
  controllerId: string;
  controlNumber: number;
  status: QualityStatus;
  completionRate: number;
  notes: string | null;
  issuesFound: string | null;
  correctionsNeeded: string | null;
  controlDate: Date | string;
  recontrolDate: Date | string | null;
  issueType: QualityIssueType | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // Relations
  task?: Task;
  controller?: User;
}

/**
 * Payment calculation for tasks
 */
export interface PaymentCalculation {
  id: string;
  taskId: string;
  area: number | string; // Decimal as string for precision
  rate: number | string; // Decimal as string for precision
  completionRate: number;
  amount: number | string; // Decimal as string for precision
  isPaid: boolean;
  paidAt: Date | string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  task?: Task;
}