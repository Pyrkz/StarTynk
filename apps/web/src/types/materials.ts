/**
 * Material-related types for web UI
 * These types extend the base types from @repo/shared/types with UI-specific fields
 */

import type { 
  Material as BaseMaterial,
  MaterialOrder as BaseMaterialOrder,
  MaterialOrderItem as BaseMaterialOrderItem,
  material_orders_status
} from '@repo/shared/types';

// Order status type for UI
export type OrderStatus = material_orders_status | 'ALL';

// Order priority types for UI
export type OrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';

// Delivery types
export type DeliveryType = 'TO_SITE' | 'TO_WAREHOUSE' | 'PICKUP';

// Order item status for UI
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

// Extended Material type with UI-specific fields
export interface Material extends BaseMaterial {
  reservedStock?: number;
  isOrderable?: boolean;
  requiresApproval?: boolean;
}

// Extended MaterialOrderItem with UI fields
export interface MaterialOrderItem extends BaseMaterialOrderItem {
  approvedQuantity?: number;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  material?: Material;
}

// Extended MaterialOrder with UI fields
export interface MaterialOrder extends BaseMaterialOrder {
  orderNumber: string;
  priority: OrderPriority;
  deliveryType: DeliveryType;
  currency: string;
  requestedDeliveryDate?: Date;
  deliveryAddress?: string;
  internalNotes?: string;
  budgetCode?: string;
  completedAt?: Date;
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
  statusHistory?: OrderStatusHistoryEntry[];
}

// Order status history entry
export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  fromStatus?: material_orders_status;
  toStatus: material_orders_status;
  changedAt: Date;
  reason: string;
  notes?: string;
  changedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

// UI Color mappings for order statuses
export const ORDER_STATUS_COLORS: Record<material_orders_status, string> = {
  NEW: 'bg-red-100 text-red-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  PARTIALLY_DELIVERED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  ON_HOLD: 'bg-gray-100 text-gray-800'
};

// UI Labels for order statuses
export const ORDER_STATUS_LABELS: Record<material_orders_status, string> = {
  NEW: 'Nowe',
  PENDING_APPROVAL: 'Oczekuje zatwierdzenia',
  APPROVED: 'Zatwierdzone',
  IN_PROGRESS: 'W realizacji',
  PARTIALLY_DELIVERED: 'Częściowo dostarczone',
  COMPLETED: 'Zrealizowane',
  CANCELLED: 'Anulowane',
  ON_HOLD: 'Wstrzymane'
};

// UI Icons for order statuses
export const ORDER_STATUS_ICONS: Record<material_orders_status, string> = {
  NEW: '🔴',
  PENDING_APPROVAL: '⏳',
  APPROVED: '✅',
  IN_PROGRESS: '🔄',
  PARTIALLY_DELIVERED: '📦',
  COMPLETED: '✔️',
  CANCELLED: '❌',
  ON_HOLD: '⏸️'
};

// UI Color mappings for priorities
export const ORDER_PRIORITY_COLORS: Record<OrderPriority, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
  CRITICAL: 'bg-red-200 text-red-900'
};

// UI Labels for priorities
export const ORDER_PRIORITY_LABELS: Record<OrderPriority, string> = {
  LOW: 'Niski',
  NORMAL: 'Normalny',
  HIGH: 'Wysoki',
  URGENT: 'Pilny',
  CRITICAL: 'Krytyczny'
};