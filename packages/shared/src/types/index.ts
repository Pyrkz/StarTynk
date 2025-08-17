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

// Export enums
export * from './enums';

// Export platform types
export * from './platform';

// Re-export commonly used types for convenience
export type {
  // Core user types
  UserDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserListItemDTO,
  UserProfileDTO,
  UserSessionDTO,
  // Response types
  PaginatedResponse,
  ApiResponse,
  // Auth types
  UnifiedUserDTO,
  UnifiedUser,
  // User utility types
  UserFiltersDTO,
  ListUsersDTO
} from './api';

// Re-export auth type aliases for convenience
export type {
  // Main auth types
  AuthResponse,
  AuthTokenPayload,
  LoginRequest,
  RegisterRequest,
  // Other auth aliases
  AuthUser,
  LoginResponse,
  // Auth interfaces
  AuthState,
  AuthContextType,
  LoginFormData,
  RegisterFormData,
  // DTO re-exports from auth.ts
  RefreshTokenResponse,
  SessionResponse,
  LogoutResponse,
  VerifyTokenResponse,
  UnifiedLoginRequest,
  UnifiedLoginRequestOptional,
  UnifiedRegisterRequest,
  UnifiedAuthResponse,
  LoginRequestDTO,
  LoginRequestDTOWithDefaults,
  TokenPayloadDTO,
  AuthTokensDTO
} from './auth';

// Re-export additional types for convenience
export type {
  // Project types
  ProjectDTO,
  // Sync types (for mobile)
  SyncRequestDTO,
  SyncResponseDTO,
  SyncChangeDTO
} from './api';

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