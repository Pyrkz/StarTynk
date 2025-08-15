import type { 
  EquipmentStatus,
  EquipmentHistoryAction
} from '@repo/database';

/**
 * Equipment category model
 */
export interface EquipmentCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Equipment model
 */
export interface Equipment {
  /** Unique identifier */
  id: string;
  
  /** Equipment name */
  name: string;
  
  /** Category ID */
  categoryId: string;
  
  /** Serial number */
  serialNumber: string | null;
  
  /** Purchase date */
  purchaseDate: Date | null;
  
  /** Purchase price */
  purchasePrice: number | null;
  
  /** Current equipment status */
  status: EquipmentStatus;
  
  /** Equipment condition */
  condition: string | null;
  
  /** Equipment description */
  description: string | null;
  
  /** Image URL */
  imageUrl: string | null;
  
  /** Whether the equipment is active */
  isActive: boolean;
  
  /** ISO 8601 timestamp of creation */
  createdAt: Date;
  
  /** ISO 8601 timestamp of last update */
  updatedAt: Date;
  
  /** Soft delete timestamp */
  deletedAt: Date | null;
}

/**
 * Equipment assignment model
 */
export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  userId: string;
  assignedDate: Date;
  returnDate: Date | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Equipment history model
 */
export interface EquipmentHistory {
  id: string;
  equipmentId: string;
  action: EquipmentHistoryAction;
  userId: string | null;
  description: string | null;
  actionDate: Date;
  isActive: boolean;
  createdAt: Date;
}