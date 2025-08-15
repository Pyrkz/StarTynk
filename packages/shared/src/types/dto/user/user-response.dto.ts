import { PaginationParams } from '../../api/pagination.types';
import { Role } from '../../enums';

/**
 * User list filters
 */
export interface UserFiltersDTO {
  role?: Role;
  isActive?: boolean;
  department?: string;
  search?: string; // Search by name, email, phone
  employmentStatus?: 'active' | 'terminated' | 'all';
}

/**
 * User list request DTO
 */
export interface ListUsersDTO extends PaginationParams {
  filters?: UserFiltersDTO;
}

/**
 * User statistics DTO
 */
export interface UserStatisticsDTO {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<Role, number>;
  usersByDepartment: Record<string, number>;
  recentlyActive: number; // Last 7 days
  newUsersThisMonth: number;
}

/**
 * User activity DTO
 */
export interface UserActivityDTO {
  userId: string;
  action: string;
  timestamp: Date | string;
  details?: string;
  ipAddress?: string;
}