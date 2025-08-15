export type OrderStatus = 
  | 'NEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'PARTIALLY_DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type OrderPriority = 
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT'
  | 'CRITICAL';

export type OrderDeliveryType = 
  | 'TO_SITE'
  | 'TO_WAREHOUSE'
  | 'PICKUP'
  | 'DIRECT_DELIVERY';

export type OrderItemStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'SOURCING'
  | 'ORDERED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'PARTIALLY_DELIVERED'
  | 'CANCELLED'
  | 'OUT_OF_STOCK';

export type WarehouseMovementType = 
  | 'IN'
  | 'OUT'
  | 'TRANSFER'
  | 'ADJUSTMENT'
  | 'RETURN'
  | 'DAMAGED'
  | 'EXPIRED'
  | 'DISPOSAL'
  | 'INVENTORY';

export interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  materials?: Material[];
}

export interface Material {
  id: string;
  name: string;
  categoryId: string;
  sku?: string;
  barcode?: string;
  unit: string;
  price?: number;
  
  // Supplier Information
  primarySupplier?: string;
  alternativeSuppliers?: string[];
  supplierSku?: string;
  
  // Product Details
  description?: string;
  specifications?: Record<string, any>;
  imageUrl?: string;
  imageUrls?: string[];
  
  // Inventory Management
  stockLevel: number;
  minStock: number;
  maxStock?: number;
  reservedStock: number;
  
  // Delivery Information
  estimatedDeliveryDays?: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  
  // Quality & Safety
  qualityGrade?: string;
  safetyNotes?: string;
  storageRequirements?: string;
  expiryMonths?: number;
  
  // Ordering Settings
  minOrderQuantity?: number;
  orderMultiple?: number;
  isOrderable: boolean;
  requiresApproval: boolean;
  
  // Administrative
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  // Relations
  category?: MaterialCategory;
  orderItems?: MaterialOrderItem[];
  warehouseMovements?: WarehouseMovement[];
}

export interface MaterialOrder {
  id: string;
  orderNumber: string;
  projectId?: string;
  orderedById: string;
  
  // Status and Workflow
  status: OrderStatus;
  priority: OrderPriority;
  
  // Approval Workflow
  approvedById?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  
  // Delivery Information
  deliveryAddress?: string;
  deliveryType: OrderDeliveryType;
  requestedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  
  // Financial
  totalAmount?: number;
  currency: string;
  budgetCode?: string;
  
  // Notes and Documentation
  notes?: string;
  internalNotes?: string;
  attachmentUrls?: string[];
  
  // Timestamps
  orderDate: Date;
  neededDate?: Date;
  completedAt?: Date;
  
  // Administrative
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  // Relations
  project?: {
    id: string;
    name: string;
    address: string;
  };
  orderedBy?: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  };
  items?: MaterialOrderItem[];
  statusHistory?: MaterialOrderStatusHistory[];
}

export interface MaterialOrderItem {
  id: string;
  orderId: string;
  materialId: string;
  
  // Quantities
  requestedQuantity: number;
  approvedQuantity?: number;
  deliveredQuantity: number;
  
  // Pricing
  unitPrice: number;
  totalPrice: number;
  
  // Item Status
  status: OrderItemStatus;
  
  // Delivery tracking
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  
  // Notes
  notes?: string;
  qualityNotes?: string;
  
  // Administrative
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  order?: MaterialOrder;
  material?: Material;
}

export interface MaterialOrderStatusHistory {
  id: string;
  orderId: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedById?: string;
  reason?: string;
  notes?: string;
  changedAt: Date;
  
  // Relations
  order?: MaterialOrder;
  changedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface WarehouseMovement {
  id: string;
  materialId: string;
  type: WarehouseMovementType;
  quantity: number;
  
  // Reference Information
  referenceType?: string;
  referenceId?: string;
  
  // Location
  fromLocation?: string;
  toLocation?: string;
  warehouseZone?: string;
  
  // Personnel
  performedById: string;
  approvedById?: string;
  
  // Documentation
  reason?: string;
  notes?: string;
  documentUrls?: string[];
  
  // Timestamps
  movementDate: Date;
  
  // Administrative
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  material?: Material;
  performedBy?: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

// Status color mappings for UI
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: 'bg-red-100 text-red-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  PARTIALLY_DELIVERED: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REJECTED: 'bg-red-100 text-red-800',
};

// Priority color mappings for UI
export const ORDER_PRIORITY_COLORS: Record<OrderPriority, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-red-200 text-red-900',
};

// Status icons for UI
export const ORDER_STATUS_ICONS: Record<OrderStatus, string> = {
  NEW: '🔴',
  PENDING_APPROVAL: '⏳',
  APPROVED: '✅',
  IN_PROGRESS: '🟡',
  PARTIALLY_DELIVERED: '🟠',
  COMPLETED: '🟢',
  CANCELLED: '⚫',
  REJECTED: '❌',
};

// Display labels for status
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Nowe',
  PENDING_APPROVAL: 'Oczekuje na zatwierdzenie',
  APPROVED: 'Zatwierdzone',
  IN_PROGRESS: 'W realizacji',
  PARTIALLY_DELIVERED: 'Częściowo dostarczone',
  COMPLETED: 'Zrealizowane',
  CANCELLED: 'Anulowane',
  REJECTED: 'Odrzucone',
};

// Display labels for priority
export const ORDER_PRIORITY_LABELS: Record<OrderPriority, string> = {
  LOW: 'Niski',
  NORMAL: 'Normalny',
  HIGH: 'Wysoki',
  URGENT: 'Pilny',
  CRITICAL: 'Krytyczny',
};