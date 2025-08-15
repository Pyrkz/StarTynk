import { MaterialOrderStatus } from '../enums';
import { User } from './user.types';
import { Project } from './project.types';

/**
 * Material category for organizing materials
 */
export interface MaterialCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // Relations
  materials?: Material[];
}

/**
 * Material model representing construction materials
 */
export interface Material {
  id: string;
  name: string;
  categoryId: string;
  unit: string;
  price: number | string | null; // Decimal as string for precision
  supplier: string | null;
  description: string | null;
  imageUrl: string | null;
  stockLevel: number;
  minStock: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // Relations
  category?: MaterialCategory;
}

/**
 * Material order for project materials
 */
export interface MaterialOrder {
  id: string;
  projectId: string;
  orderedById: string;
  status: MaterialOrderStatus;
  totalAmount: number | string | null; // Decimal as string for precision
  notes: string | null;
  orderDate: Date | string;
  neededDate: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // Relations
  project?: Project;
  orderedBy?: User;
  items?: MaterialOrderItem[];
}

/**
 * Material order item linking materials to orders
 */
export interface MaterialOrderItem {
  id: string;
  orderId: string;
  materialId: string;
  quantity: number;
  unitPrice: number | string; // Decimal as string for precision
  notes: string | null;
  // Relations
  material?: Material;
  order?: MaterialOrder;
}