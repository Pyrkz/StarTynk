/**
 * Shared enums used across the application
 * These are defined as const objects for better tree-shaking and type safety
 */

export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  COORDINATOR: 'COORDINATOR',
  WORKER: 'WORKER'
} as const;
export type Role = typeof Role[keyof typeof Role];

export const ProjectStatus = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;
export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const TaskStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  APPROVED: 'APPROVED',
  PAID: 'PAID'
} as const;
export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;
export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

export const QualityStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PARTIALLY_APPROVED: 'PARTIALLY_APPROVED'
} as const;
export type QualityStatus = typeof QualityStatus[keyof typeof QualityStatus];

export const QualityIssueType = {
  OUR_FAULT: 'OUR_FAULT',
  EXTERNAL_FAULT: 'EXTERNAL_FAULT',
  MATERIAL_DEFECT: 'MATERIAL_DEFECT',
  DESIGN_ISSUE: 'DESIGN_ISSUE'
} as const;
export type QualityIssueType = typeof QualityIssueType[keyof typeof QualityIssueType];

export const EquipmentStatus = {
  AVAILABLE: 'AVAILABLE',
  ASSIGNED: 'ASSIGNED',
  DAMAGED: 'DAMAGED',
  RETIRED: 'RETIRED'
} as const;
export type EquipmentStatus = typeof EquipmentStatus[keyof typeof EquipmentStatus];

export const EquipmentHistoryAction = {
  ASSIGNED: 'ASSIGNED',
  RETURNED: 'RETURNED',
  DAMAGED: 'DAMAGED',
  REPAIRED: 'REPAIRED',
  RETIRED: 'RETIRED',
  PURCHASED: 'PURCHASED'
} as const;
export type EquipmentHistoryAction = typeof EquipmentHistoryAction[keyof typeof EquipmentHistoryAction];

export const VehicleStatus = {
  ACTIVE: 'ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  RETIRED: 'RETIRED'
} as const;
export type VehicleStatus = typeof VehicleStatus[keyof typeof VehicleStatus];

export const MaintenanceType = {
  INSPECTION: 'INSPECTION',
  REPAIR: 'REPAIR',
  SERVICE: 'SERVICE',
  INSURANCE: 'INSURANCE'
} as const;
export type MaintenanceType = typeof MaintenanceType[keyof typeof MaintenanceType];

export const ReminderType = {
  INSPECTION: 'INSPECTION',
  INSURANCE: 'INSURANCE',
  SERVICE: 'SERVICE',
  REPAIR: 'REPAIR'
} as const;
export type ReminderType = typeof ReminderType[keyof typeof ReminderType];

export const PhotoType = {
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
  ISSUE: 'ISSUE',
  DOCUMENTATION: 'DOCUMENTATION',
  INVOICE: 'INVOICE'
} as const;
export type PhotoType = typeof PhotoType[keyof typeof PhotoType];

export const MaterialOrderStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  PARTIALLY_DELIVERED: 'PARTIALLY_DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;
export type MaterialOrderStatus = typeof MaterialOrderStatus[keyof typeof MaterialOrderStatus];

export const DeliveryStatus = {
  PENDING: 'PENDING',
  RECEIVED: 'RECEIVED',
  QUALITY_CHECK: 'QUALITY_CHECK',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
} as const;
export type DeliveryStatus = typeof DeliveryStatus[keyof typeof DeliveryStatus];