// Export all model types
export * from './models';

// Export all API types
export * from './api';

// Export all DTO types
export * from './dto';

// Export type guards
export * from './guards';

// Export auth types (new unified types)
export * from './auth';

// Re-export commonly used database types and enums for convenience
export type {
  User,
  Project,
  Task,
  Vehicle,
  Equipment,
  Material,
  Developer,
  Apartment,
  TaskAssignment,
  QualityControl,
  ProjectAssignment,
  Attendance,
  LeaveRequest,
  Payroll,
  MaterialOrder,
  MaterialOrderItem,
  Delivery,
  DeliveryItem,
  VehicleAssignment,
  VehicleMaintenance,
  VehicleReminder,
  EquipmentAssignment,
  EquipmentHistory,
  Photo,
  Comment,
  PaymentCalculation,
  Bonus,
  Deduction
} from '@repo/database';

// Re-export enums for easy access
export {
  Role,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  QualityStatus,
  QualityIssueType,
  EquipmentStatus,
  EquipmentHistoryAction,
  VehicleStatus,
  MaintenanceType,
  ReminderType,
  PhotoType,
  material_orders_status,
  deliveries_status,
  LeaveType,
  LeaveStatus,
  PaymentStatus,
  PaymentMethod,
  BonusType,
  DeductionType
} from '@repo/database';