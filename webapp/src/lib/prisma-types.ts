// Centralized Prisma type exports to handle module resolution issues
// This file acts as a bridge to ensure TypeScript can properly resolve Prisma types

// Import all needed types from Prisma client
import type { Prisma } from '@prisma/client'

// Export enums that are commonly used across the application
export { 
  VehicleStatus, 
  VehicleType, 
  MaintenanceType, 
  ReminderType,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  EquipmentStatus,
  EquipmentHistoryAction
} from '@prisma/client'

// Export commonly used Prisma utility types
export type { Prisma }

// Export model types directly from Prisma client
export type { 
  Vehicle,
  VehicleAssignment,
  VehicleMaintenance,
  VehicleReminder,
  VehicleProjectAssignment,
  Project,
  Task,
  User,
  Developer,
  Apartment
} from '@prisma/client'