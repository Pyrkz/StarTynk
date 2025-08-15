// Database to DTO mappers for Prisma types
import type {
  User,
  Project,
  Task,
  Vehicle,
  Equipment,
  Material,
  Developer,
  Apartment
} from '@repo/database'

// User mappers
export type UserDTO = Omit<User, 'password' | 'deletedAt'>

export function mapUserToDTO(user: User): UserDTO {
  const { password, deletedAt, ...userDTO } = user
  return userDTO
}

// Project mappers
export type ProjectDTO = Project & {
  developer?: Developer
  coordinator?: UserDTO
}

// Task mappers
export type TaskDTO = Task & {
  project?: Project
  apartment?: Apartment | null
}

// Vehicle mappers
export type VehicleDTO = Vehicle

// Equipment mappers
export type EquipmentDTO = Equipment

// Material mappers  
export type MaterialDTO = Material