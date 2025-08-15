/**
 * Common enums used across the application
 */

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export enum FilterOperator {
  EQ = 'eq',
  NE = 'ne',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  LIKE = 'like',
  IN = 'in'
}

export enum EntityType {
  USER = 'USER',
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  VEHICLE = 'VEHICLE',
  EQUIPMENT = 'EQUIPMENT',
  MATERIAL = 'MATERIAL',
  DELIVERY = 'DELIVERY'
}

export enum ActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  ASSIGN = 'ASSIGN',
  UNASSIGN = 'UNASSIGN'
}