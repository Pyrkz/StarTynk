import type { User, Role } from '@repo/database';
import type { 
  UserDTO, 
  UserListItemDTO as UserListDTO, 
  UserProfileDTO
} from '../types/dto/user';

// Temporary compatibility interface until mapper is updated
interface UserWithStatsDTO extends UserDTO {
  stats?: {
    projectCount: number;
    taskCount: number;
    completedTasks: number;
    hoursWorked: number;
    averageRating: number;
  };
}

/**
 * User mapper class for converting between Prisma models and DTOs
 * Ensures sensitive data is never exposed to clients
 */
export class UserMapper {
  /**
   * Convert User model to UserDTO (excludes password and deletedAt)
   */
  static toDTO(user: User): UserDTO {
    const { password, deletedAt, ...rest } = user;
    return {
      ...rest,
      role: rest.role as Role,
      emailVerified: !!rest.emailVerified,
      phoneVerified: false, // Default value, should be updated based on actual data
      lastLoginAt: rest.lastLoginAt?.toISOString() ?? null,
      createdAt: rest.createdAt.toISOString(),
      updatedAt: rest.updatedAt.toISOString(),
      isProfileComplete: this.isProfileComplete(user)
    };
  }

  /**
   * Convert User model to UserListDTO (minimal info for tables)
   */
  static toListDTO(user: User): UserListDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      isActive: user.isActive,
      position: user.position,
      department: user.department,
      lastActivityAt: user.lastLoginAt || user.updatedAt
    };
  }

  /**
   * Convert User model to UserProfileDTO (excludes only password)
   */
  static toProfileDTO(
    user: User, 
    stats?: { projectCount: number; taskCount: number }
  ): UserProfileDTO {
    const { password, ...rest } = user;
    return {
      ...rest,
      role: rest.role as Role,
      emailVerified: !!rest.emailVerified,
      phoneVerified: false, // Default value, should be updated based on actual data
      loginCount: rest.loginCount ?? 0,
      lastLoginAt: rest.lastLoginAt?.toISOString() ?? null,
      createdAt: rest.createdAt.toISOString(),
      updatedAt: rest.updatedAt.toISOString(),
      employmentStartDate: rest.employmentStartDate?.toISOString() ?? null,
      employmentEndDate: rest.employmentEndDate?.toISOString() ?? null,
      projectCount: stats?.projectCount,
      taskCount: stats?.taskCount,
      lastActivityAt: (rest.lastLoginAt || rest.updatedAt).toISOString(),
      isProfileComplete: this.isProfileComplete(user)
    };
  }

  /**
   * Convert User model to UserWithStatsDTO (with performance statistics)
   */
  static toWithStatsDTO(
    user: User,
    stats: {
      projectCount: number;
      taskCount: number;
      completedTasks: number;
      hoursWorked: number;
      averageRating: number;
    }
  ): UserWithStatsDTO {
    return {
      ...this.toDTO(user),
      stats
    };
  }

  /**
   * Convert array of User models to UserDTO array
   */
  static toDTOArray(users: User[]): UserDTO[] {
    return users.map(user => this.toDTO(user));
  }

  /**
   * Convert array of User models to UserListDTO array
   */
  static toListDTOArray(users: User[]): UserListDTO[] {
    return users.map(user => this.toListDTO(user));
  }

  /**
   * Check if user profile is complete
   * @private
   */
  private static isProfileComplete(user: User): boolean {
    return !!(
      user.name &&
      user.email &&
      user.phone &&
      user.position &&
      user.department
    );
  }

  /**
   * Sanitize user data for public display (removes even more sensitive info)
   */
  static toPublicDTO(user: User): Pick<User, 'id' | 'name' | 'position'> {
    return {
      id: user.id,
      name: user.name,
      position: user.position
    };
  }
}