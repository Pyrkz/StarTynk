// Import from local database types until @repo/database is available
import type { User, Prisma } from '../database/prisma-types';
import { 
  UserDTO, 
  UserProfileDTO, 
  CreateUserDTO,
  UserListItemDTO,
  UserSessionDTO,
  UserWithRelationsDTO 
} from '../dto/user';
import { BaseMapper } from './base.mapper';
import { Role } from '../enums';

class UserMapper extends BaseMapper<User, UserDTO> {
  toDTO(entity: User): UserDTO {
    return {
      id: entity.id,
      email: entity.email,
      phone: entity.phone,
      name: entity.name,
      role: entity.role as Role,
      image: entity.image,
      position: entity.position,
      department: entity.department,
      isActive: entity.isActive,
      emailVerified: !!entity.emailVerified,
      phoneVerified: !!entity.phoneVerified,
      lastLoginAt: this.toISOString(entity.lastLoginAt),
      createdAt: this.toISOString(entity.createdAt) || new Date().toISOString(),
      updatedAt: this.toISOString(entity.updatedAt) || new Date().toISOString(),
    };
  }

  toListItemDTO(entity: User): UserListItemDTO {
    return {
      id: entity.id,
      email: entity.email,
      phone: entity.phone,
      name: entity.name,
      role: entity.role as Role,
      isActive: entity.isActive,
      lastLoginAt: this.toISOString(entity.lastLoginAt),
      position: entity.position,
      department: entity.department,
    };
  }

  toProfileDTO(entity: User & { _count?: any }): UserProfileDTO {
    const base = this.toDTO(entity);
    return {
      ...base,
      loginCount: entity.loginCount || 0,
      invitedBy: entity.invitedBy,
      employmentStartDate: this.toISOString(entity.employmentStartDate),
      employmentEndDate: this.toISOString(entity.employmentEndDate),
      _count: entity._count,
    };
  }

  toWithRelationsDTO(entity: any): UserWithRelationsDTO {
    const profile = this.toProfileDTO(entity);
    return {
      ...profile,
      coordinator: entity.coordinator ? {
        id: entity.coordinator.id,
        name: entity.coordinator.name,
      } : undefined,
      inviter: entity.inviter ? {
        id: entity.inviter.id,
        name: entity.inviter.name,
        email: entity.inviter.email,
      } : undefined,
      currentVehicles: this.transformArray(entity.vehicleAssignments, (assignment: any) => ({
        id: assignment.vehicle.id,
        make: assignment.vehicle.make,
        model: assignment.vehicle.model,
        licensePlate: assignment.vehicle.licensePlate,
      })),
      currentEquipment: this.transformArray(entity.equipmentAssignments, (assignment: any) => ({
        id: assignment.equipment.id,
        name: assignment.equipment.name,
        serialNumber: assignment.equipment.serialNumber,
      })),
    };
  }

  toEntity(dto: Partial<UserDTO>): Partial<User> {
    return {
      email: dto.email || null,
      phone: dto.phone || null,
      name: dto.name || null,
      role: dto.role,
      image: dto.image || null,
      position: dto.position || null,
      department: dto.department || null,
      isActive: dto.isActive,
    } as Partial<User>;
  }

  toCreateEntity(dto: CreateUserDTO): Prisma.UserCreateInput {
    return {
      email: dto.email,
      phone: dto.phone,
      name: dto.name,
      role: dto.role || Role.USER,
      position: dto.position,
      department: dto.department,
      employmentStartDate: dto.employmentStartDate 
        ? this.toDate(dto.employmentStartDate) 
        : undefined,
      // Note: password should be hashed before saving
      password: dto.password,
    };
  }

  // Helper to sanitize user for public response
  toPublicDTO(entity: User): Omit<UserDTO, 'email' | 'phone'> {
    const dto = this.toDTO(entity);
    return this.exclude(dto, 'email', 'phone');
  }

  // Helper for session/token payload
  toSessionDTO(entity: User): UserSessionDTO {
    return {
      id: entity.id,
      email: entity.email,
      phone: entity.phone,
      role: entity.role as Role,
      name: entity.name,
      image: entity.image,
      isActive: entity.isActive,
    };
  }

  // Helper to prepare update data
  toUpdateEntity(dto: Partial<UserDTO>): Prisma.UserUpdateInput {
    const updateData: Prisma.UserUpdateInput = {};
    
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.position !== undefined) updateData.position = dto.position;
    if (dto.department !== undefined) updateData.department = dto.department;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.image !== undefined) updateData.image = dto.image;
    
    return updateData;
  }
}

export const userMapper = new UserMapper();