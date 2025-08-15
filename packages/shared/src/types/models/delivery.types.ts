import { DeliveryStatus } from '../enums';
import { User } from './user.types';
import { Project } from './project.types';
import { Material } from './material.types';

/**
 * Delivery model for material deliveries
 */
export interface Delivery {
  id: string;
  projectId: string;
  supplierName: string;
  deliveryDate: Date | string;
  receivedById: string;
  status: DeliveryStatus;
  deliveryType: string;
  totalWeight: number | string | null; // Decimal as string for precision
  notes: string | null;
  documentUrl: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // Relations
  project?: Project;
  receivedBy?: User;
  items?: DeliveryItem[];
}

/**
 * Delivery item linking materials to deliveries
 */
export interface DeliveryItem {
  id: string;
  deliveryId: string;
  materialId: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  qualityStatus: string | null;
  notes: string | null;
  // Relations
  delivery?: Delivery;
  material?: Material;
}