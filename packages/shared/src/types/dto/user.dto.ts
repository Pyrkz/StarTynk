import type { User } from '@repo/database';

/**
 * Data Transfer Object for User entity
 * Excludes sensitive information like password
 * @see User - Original Prisma model
 */
export type UserDTO = Omit<User, 'password' | 'deletedAt'> & {
  /** Whether user has completed profile setup */
  isProfileComplete?: boolean;
};

/**
 * User list DTO for table views
 * Only includes essential information for lists
 */
export type UserListDTO = Pick<User, 
  'id' | 'name' | 'email' | 'role' | 'isActive' | 'position' | 'department'
> & {
  /** Last activity timestamp */
  lastActivityAt?: Date;
};

/**
 * User profile DTO with extended information
 */
export type UserProfileDTO = Omit<User, 'password'> & {
  /** Number of projects assigned to user */
  projectCount?: number;
  /** Number of tasks assigned to user */
  taskCount?: number;
  /** Last activity timestamp */
  lastActivityAt?: Date;
  /** Whether user profile is complete */
  isProfileComplete?: boolean;
};

/**
 * Create user DTO for user registration/creation
 */
export type CreateUserDTO = {
  email: string;
  name: string;
  password: string;
  role: string;
  phone?: string;
  position?: string;
  department?: string;
  employmentStartDate?: Date;
  invitedBy?: string;
};

/**
 * Update user DTO for profile updates
 */
export type UpdateUserDTO = Partial<Omit<CreateUserDTO, 'email' | 'password'>>;

/**
 * User with statistics DTO
 */
export type UserWithStatsDTO = UserDTO & {
  stats?: {
    projectCount: number;
    taskCount: number;
    completedTasks: number;
    hoursWorked: number;
    averageRating: number;
  };
};