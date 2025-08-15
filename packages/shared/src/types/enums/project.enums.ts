/**
 * Project and task related enums
 */

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TaskStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  APPROVED = 'APPROVED',
  PAID = 'PAID'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum QualityStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED'
}

export enum QualityIssueType {
  OUR_FAULT = 'OUR_FAULT',
  EXTERNAL_FAULT = 'EXTERNAL_FAULT',
  MATERIAL_DEFECT = 'MATERIAL_DEFECT',
  DESIGN_ISSUE = 'DESIGN_ISSUE'
}

export enum PhotoType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  ISSUE = 'ISSUE',
  DOCUMENTATION = 'DOCUMENTATION',
  INVOICE = 'INVOICE'
}