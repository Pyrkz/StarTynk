import { EquipmentStatus, EquipmentHistoryAction } from '../enums';
import { User } from './user.types';

/**
 * Equipment category for organizing equipment
 */
export interface EquipmentCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // Relations
  equipment?: Equipment[];
}

/**
 * Equipment model representing tools and machinery
 */
export interface Equipment {
  id: string;
  name: string;
  categoryId: string;
  serialNumber: string | null;
  purchaseDate: Date | string | null;
  purchasePrice: number | string | null; // Decimal as string for precision
  status: EquipmentStatus;
  condition: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // Relations
  category?: EquipmentCategory;
  assignments?: EquipmentAssignment[];
  history?: EquipmentHistory[];
}

/**
 * Equipment assignment to users
 */
export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  userId: string;
  assignedDate: Date | string;
  returnDate: Date | string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  equipment?: Equipment;
  user?: User;
}

/**
 * Equipment history tracking
 */
export interface EquipmentHistory {
  id: string;
  equipmentId: string;
  action: EquipmentHistoryAction;
  userId: string | null;
  description: string | null;
  actionDate: Date | string;
  isActive: boolean;
  createdAt: Date | string;
  // Relations
  equipment?: Equipment;
}