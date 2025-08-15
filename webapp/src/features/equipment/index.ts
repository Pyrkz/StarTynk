// Equipment Feature Module

// Types
export * from './types/equipment.types';

// Hooks
export * from './hooks/useEquipment';

// Re-export everything for easy importing
export { useEquipment, useEquipmentOperations, useEquipmentCategories } from './hooks/useEquipment';
export type {
  EquipmentWithRelations,
  EquipmentCategoryWithStats,
  EquipmentAssignmentWithRelations,
  EquipmentViewMode,
  EquipmentFilters,
  EquipmentSortOptions,
  EquipmentStats,
  CategoryOverview,
  CreateEquipmentData,
  UpdateEquipmentData,
  EquipmentAssignmentData,
  BulkOperationData,
  EquipmentHistoryEntry,
  EquipmentMovementHistory,
  EquipmentCondition,
  MaintenanceRecord,
  EquipmentReport,
  UserEquipmentSummary,
  EquipmentListResponse,
  CategoryListResponse,
  EquipmentDetailResponse,
  EquipmentError,
  EQUIPMENT_CONDITIONS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_COLORS,
  HISTORY_ACTION_LABELS,
} from './types/equipment.types';