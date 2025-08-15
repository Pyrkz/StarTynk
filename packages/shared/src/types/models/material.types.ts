import type { 
  material_orders_status,
  deliveries_status
} from '@repo/database';

/**
 * Material category model
 */
export interface MaterialCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Material model
 */
export interface Material {
  /** Unique identifier */
  id: string;
  
  /** Material name */
  name: string;
  
  /** Category ID */
  categoryId: string;
  
  /** Unit of measurement */
  unit: string;
  
  /** Price per unit */
  price: number | null;
  
  /** Supplier name */
  supplier: string | null;
  
  /** Material description */
  description: string | null;
  
  /** Image URL */
  imageUrl: string | null;
  
  /** Current stock level */
  stockLevel: number;
  
  /** Minimum stock level */
  minStock: number;
  
  /** Whether the material is active */
  isActive: boolean;
  
  /** ISO 8601 timestamp of creation */
  createdAt: Date;
  
  /** ISO 8601 timestamp of last update */
  updatedAt: Date;
  
  /** Soft delete timestamp */
  deletedAt: Date | null;
}

/**
 * Material order model
 */
export interface MaterialOrder {
  id: string;
  projectId: string;
  orderedById: string;
  status: material_orders_status;
  totalAmount: number | null;
  notes: string | null;
  orderDate: Date;
  neededDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Material order item model
 */
export interface MaterialOrderItem {
  id: string;
  orderId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
}

/**
 * Delivery model
 */
export interface Delivery {
  id: string;
  projectId: string;
  supplierName: string;
  deliveryDate: Date;
  receivedById: string;
  status: deliveries_status;
  deliveryType: string;
  totalWeight: number | null;
  notes: string | null;
  documentUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Delivery item model
 */
export interface DeliveryItem {
  id: string;
  deliveryId: string;
  materialId: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  qualityStatus: string | null;
  notes: string | null;
}