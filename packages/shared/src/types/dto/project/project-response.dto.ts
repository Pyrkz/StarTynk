import { PaginationParams } from '../../api/pagination.types';
import { ProjectStatus } from '../../enums';

/**
 * Project list filters
 */
export interface ProjectFiltersDTO {
  status?: ProjectStatus | ProjectStatus[];
  developerId?: string;
  coordinatorId?: string;
  isActive?: boolean;
  search?: string; // Search by name or address
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
  endDateFrom?: Date | string;
  endDateTo?: Date | string;
}

/**
 * Project list request DTO
 */
export interface ListProjectsDTO extends PaginationParams {
  filters?: ProjectFiltersDTO;
}

/**
 * Project statistics summary DTO
 */
export interface ProjectStatisticsSummaryDTO {
  totalProjects: number;
  projectsByStatus: Record<ProjectStatus, number>;
  activeProjects: number;
  totalValue: number;
  averageProjectDuration: number; // In days
  upcomingDeadlines: number; // Projects ending in next 30 days
}

/**
 * Project summary DTO
 */
export interface ProjectSummaryDTO {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  progress: number; // Percentage
  tasksTotal: number;
  tasksCompleted: number;
  totalBudget: number;
  spentBudget: number;
  startDate: Date | string;
  endDate: Date | string;
  daysRemaining: number;
}

/**
 * Project financial summary DTO
 */
export interface ProjectFinancialSummaryDTO {
  projectId: string;
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  pendingPayments: number;
  completedPayments: number;
  materialCosts: number;
  laborCosts: number;
  otherCosts: number;
}