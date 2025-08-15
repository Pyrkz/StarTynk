// This script creates type exports from Prisma Client
const fs = require('fs');
const path = require('path');

const typeExports = `
// Auto-generated Prisma type exports
export type {
  User,
  Account,
  Session,
  VerificationToken,
  InvitationCode,
  UserActivityLog,
  RefreshToken,
  Developer,
  Project,
  Apartment,
  Task,
  TaskAssignment,
  QualityControl,
  MaterialCategory,
  Material,
  MaterialOrder,
  MaterialOrderItem,
  EquipmentCategory,
  Equipment,
  EquipmentAssignment,
  EquipmentHistory,
  Delivery,
  DeliveryItem,
  Vehicle,
  VehicleAssignment,
  VehicleMaintenance,
  VehicleReminder,
  Photo,
  Comment,
  PaymentCalculation,
  ProjectAssignment,
  Attendance,
  LeaveRequest,
  Payroll,
  Bonus,
  Deduction,
} from '@prisma/client';

// Export all enums
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
  DeductionType,
} from '@prisma/client';

// Prisma utility types
export type { Prisma } from '@prisma/client';

// Re-export the client for convenience
export { PrismaClient } from '@prisma/client';
`;

fs.writeFileSync(
  path.join(__dirname, '../src/types.ts'),
  typeExports
);

console.log('✅ Generated Prisma type exports');