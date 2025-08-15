import type { User } from '@repo/database';
import type { 
  UserDTO, 
  UserListDTO, 
  UserProfileDTO,
  UserWithStatsDTO 
} from '../types/dto/user.dto';

/**
 * User mapper class for converting between Prisma models and DTOs
 * Ensures sensitive data is never exposed to clients
 */
export class UserMapper {
  /**
   * Convert User model to UserDTO (excludes password and deletedAt)
   */
  static toDTO(user: User): UserDTO {
    const { password, deletedAt, ...dto } = user;
    return {
      ...dto,
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
      role: user.role,
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
    const { password, ...profile } = user;
    return {
      ...profile,
      projectCount: stats?.projectCount,
      taskCount: stats?.taskCount,
      lastActivityAt: user.lastLoginAt || user.updatedAt,
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