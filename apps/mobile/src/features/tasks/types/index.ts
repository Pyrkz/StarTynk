export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'READY_FOR_PICKUP' | 'APPROVED' | 'PAID';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  project: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  area: number;
  completionRate: number;
  assigneeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  projectId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}