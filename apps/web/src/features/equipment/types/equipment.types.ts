import { 
  Equipment, 
  EquipmentCategory, 
  EquipmentAssignment, 
  EquipmentHistory,
  EquipmentStatus,
  EquipmentHistoryAction,
  User 
} from '@repo/database';

// ============== BASE TYPES ==============
export interface EquipmentWithRelations {
  id: string;
  name: string;
  categoryId: string;
  serialNumber?: string | null;
  purchaseDate?: Date | null;
  purchasePrice?: number | string | null;
  status: EquipmentStatus;
  condition?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  category: EquipmentCategory;
  assignments: (EquipmentAssignment & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
  history: EquipmentHistory[];
  _count?: {
    assignments: number;
    history: number;
  };
}

export interface EquipmentCategoryWithStats {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  equipment: Equipment[];
  _count: {
    equipment: number;
  };
  stats: {
    total: number;
    available: number;
    assigned: number;
    damaged: number;
    retired: number;
  };
}

export interface EquipmentAssignmentWithRelations extends EquipmentAssignment {
  equipment: Equipment & {
    category: EquipmentCategory;
  };
  user: Pick<User, 'id' | 'name' | 'email' | 'position'>;
}

// ============== VIEW MODES ==============
export type EquipmentViewMode = 'grid' | 'list';

export interface EquipmentFilters {
  search?: string;
  categoryId?: string;
  status?: EquipmentStatus[];
  condition?: string[];
  assignedTo?: string;
  location?: string;
}

export interface EquipmentSortOptions {
  field: 'name' | 'category' | 'status' | 'condition' | 'assignedDate' | 'updatedAt';
  direction: 'asc' | 'desc';
}

// ============== DASHBOARD TYPES ==============
export interface EquipmentStats {
  total: number;
  available: number;
  assigned: number;
  damaged: number;
  retired: number;
  utilizationRate: number; // percentage of equipment currently in use
  maintenanceRequired: number; // equipment needing maintenance
}

export interface CategoryOverview {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  stats: {
    total: number;
    available: number;
    assigned: number;
    damaged: number;
    retired: number;
  };
  recentActivity: {
    assignmentsToday: number;
    returnsToday: number;
    damageReports: number;
  };
  equipmentList: DetailedEquipmentItem[];
}

// ============== DETAILED EQUIPMENT TYPES ==============
export interface DetailedEquipmentItem {
  id: string;
  categoryId: string;
  name: string;
  model?: string;
  serialNumber: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  purchaseDate: string;
  purchasePrice: number;
  currentAssignment?: {
    employeeId: string;
    employeeName: string;
    assignedDate: string;
    expectedReturnDate?: string;
    project?: string;
    notes?: string;
  };
  location: string;
  lastActivity: string;
  assignmentHistory: AssignmentHistoryEntry[];
  maintenanceHistory: MaintenanceHistoryEntry[];
}

export interface AssignmentHistoryEntry {
  id: string;
  employeeName: string;
  employeeId: string;
  assignedDate: string;
  returnDate?: string;
  duration?: number; // in days
  project?: string;
  notes?: string;
  returnCondition?: EquipmentCondition;
}

export interface MaintenanceHistoryEntry {
  id: string;
  type: 'inspection' | 'repair' | 'service' | 'calibration';
  date: string;
  description: string;
  cost: number;
  serviceProvider?: string;
  nextDueDate?: string;
  notes?: string;
}

// ============== MOCK CATEGORY DATA ==============
export interface MockCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  totalCount: number;
  availableCount: number;
  assignedCount: number;
  damagedCount: number;
  equipmentList: DetailedEquipmentItem[];
}

// ============== FORMS & OPERATIONS ==============
export interface CreateEquipmentData {
  name: string;
  categoryId: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  condition?: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateEquipmentData extends Partial<CreateEquipmentData> {
  status?: EquipmentStatus;
}

export interface EquipmentAssignmentData {
  equipmentId: string;
  userId: string;
  notes?: string;
  expectedReturnDate?: Date;
}

export interface BulkOperationData {
  equipmentIds: string[];
  operation: 'assign' | 'return' | 'updateStatus' | 'updateLocation';
  data: {
    userId?: string;
    status?: EquipmentStatus;
    location?: string;
    notes?: string;
  };
}

// ============== HISTORY & TRACKING ==============
export interface EquipmentHistoryEntry {
  id: string;
  action: EquipmentHistoryAction;
  description?: string;
  actionDate: Date;
  userId?: string;
  userName?: string;
  details?: {
    fromStatus?: EquipmentStatus;
    toStatus?: EquipmentStatus;
    assignedTo?: string;
    returnedBy?: string;
    location?: string;
    condition?: string;
  };
}

export interface EquipmentMovementHistory {
  equipmentId: string;
  movements: {
    id: string;
    action: EquipmentHistoryAction;
    date: Date;
    user: string;
    location?: string;
    notes?: string;
  }[];
}

// ============== MAINTENANCE & CONDITIONS ==============
export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  type: 'inspection' | 'repair' | 'service' | 'calibration';
  description: string;
  cost?: number;
  serviceDate: Date;
  nextDueDate?: Date;
  serviceProvider?: string;
  notes?: string;
}

// ============== REPORTING ==============
export interface EquipmentReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalEquipment: number;
    newAdditions: number;
    retiredItems: number;
    damageIncidents: number;
    maintenanceCosts: number;
  };
  utilizationStats: {
    averageUtilization: number;
    mostUsedCategories: string[];
    leastUsedEquipment: string[];
  };
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    totalItems: number;
    utilizationRate: number;
  }[];
}

// ============== USER EQUIPMENT OVERVIEW ==============
export interface UserEquipmentSummary {
  userId: string;
  userName: string;
  userEmail: string;
  position?: string;
  assignedEquipment: {
    id: string;
    name: string;
    category: string;
    assignedDate: Date;
    expectedReturnDate?: Date;
    isOverdue: boolean;
    condition: string;
  }[];
  totalAssigned: number;
  overdueCount: number;
  recentReturns: number;
}

// ============== API RESPONSE TYPES ==============
export interface EquipmentListResponse {
  equipment: EquipmentWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: EquipmentStats;
}

export interface CategoryListResponse {
  categories: EquipmentCategoryWithStats[];
  totalEquipment: number;
}

export interface EquipmentDetailResponse {
  equipment: EquipmentWithRelations;
  history: EquipmentHistoryEntry[];
  maintenance: MaintenanceRecord[];
  relatedEquipment: Equipment[];
}

// ============== ERROR TYPES ==============
export interface EquipmentError {
  code: 'NOT_FOUND' | 'ALREADY_ASSIGNED' | 'DAMAGED' | 'VALIDATION_ERROR' | 'UNAUTHORIZED';
  message: string;
  details?: Record<string, unknown>;
}

// ============== CONSTANTS ==============
export const EQUIPMENT_CONDITIONS: { value: EquipmentCondition; label: string; color: string }[] = [
  { value: 'excellent', label: 'Doskonały', color: 'green' },
  { value: 'good', label: 'Dobry', color: 'blue' },
  { value: 'fair', label: 'Zadowalający', color: 'yellow' },
  { value: 'poor', label: 'Słaby', color: 'orange' },
  { value: 'damaged', label: 'Uszkodzony', color: 'red' },
];

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  AVAILABLE: 'Dostępny',
  ASSIGNED: 'Wydany',
  DAMAGED: 'Uszkodzony',
  RETIRED: 'Wycofany',
};

export const EQUIPMENT_STATUS_COLORS: Record<EquipmentStatus, string> = {
  AVAILABLE: 'green',
  ASSIGNED: 'blue',
  DAMAGED: 'red',
  RETIRED: 'gray',
};

export const HISTORY_ACTION_LABELS: Record<EquipmentHistoryAction, string> = {
  ASSIGNED: 'Wydano',
  RETURNED: 'Zwrócono',
  DAMAGED: 'Zgłoszono uszkodzenie',
  REPAIRED: 'Naprawiono',
  RETIRED: 'Wycofano',
  PURCHASED: 'Zakupiono',
};
