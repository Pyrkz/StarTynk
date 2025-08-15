/**
 * Material and delivery related enums
 */

export enum MaterialOrderStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  QUALITY_CHECK = 'QUALITY_CHECK',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}