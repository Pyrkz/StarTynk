import { TaskStatus, TaskPriority } from '../../enums';
import type { QualityControlDTO } from './quality-control.dto';
import type { PaymentCalculationDTO } from './payment.dto';
import type { PhotoDTO } from './photo.dto';
import type { CommentDTO } from './comment.dto';

export interface TaskDTO {
  id: string;
  projectId: string;
  apartmentId?: string | null;
  title: string;
  description?: string | null;
  area: number;
  rate: number;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours?: number | null;
  actualHours?: number | null;
  dueDate?: string | null;
  assignees?: TaskAssigneeDTO[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListItemDTO {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  area: number;
  rate: number;
  dueDate?: string | null;
  apartmentNumber?: string;
  assigneeCount: number;
}

export interface TaskDetailDTO extends TaskDTO {
  project?: {
    id: string;
    name: string;
  };
  apartment?: {
    id: string;
    number: string;
    floor?: number;
  };
  qualityControls?: QualityControlDTO[];
  payments?: PaymentCalculationDTO[];
  photos?: PhotoDTO[];
  comments?: CommentDTO[];
}

export interface TaskAssigneeDTO {
  userId: string;
  userName?: string | null;
  role?: string | null;
  assignedAt?: string;
}

export interface CreateTaskDTO {
  projectId: string;
  apartmentId?: string;
  title: string;
  description?: string;
  area: number;
  rate: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
  dueDate?: string;
  assigneeIds?: string[];
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string | null;
  area?: number;
  rate?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number | null;
  actualHours?: number | null;
  dueDate?: string | null;
  isActive?: boolean;
}

export interface AssignTaskDTO {
  userIds: string[];
  role?: string;
}