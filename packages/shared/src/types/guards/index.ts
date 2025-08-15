import { 
  Role, 
  ProjectStatus, 
  TaskStatus, 
  TaskPriority,
  QualityStatus,
  QualityIssueType,
  VehicleStatus,
  EquipmentStatus,
  MaterialOrderStatus,
  DeliveryStatus,
  LoginMethod,
  ClientType,
  EntityType
} from '../enums';

// Enum type guards
export function isRole(value: any): value is Role {
  return Object.values(Role).includes(value);
}

export function isProjectStatus(value: any): value is ProjectStatus {
  return Object.values(ProjectStatus).includes(value);
}

export function isTaskStatus(value: any): value is TaskStatus {
  return Object.values(TaskStatus).includes(value);
}

export function isTaskPriority(value: any): value is TaskPriority {
  return Object.values(TaskPriority).includes(value);
}

export function isQualityStatus(value: any): value is QualityStatus {
  return Object.values(QualityStatus).includes(value);
}

export function isQualityIssueType(value: any): value is QualityIssueType {
  return Object.values(QualityIssueType).includes(value);
}

export function isVehicleStatus(value: any): value is VehicleStatus {
  return Object.values(VehicleStatus).includes(value);
}

export function isEquipmentStatus(value: any): value is EquipmentStatus {
  return Object.values(EquipmentStatus).includes(value);
}

export function isMaterialOrderStatus(value: any): value is MaterialOrderStatus {
  return Object.values(MaterialOrderStatus).includes(value);
}

export function isDeliveryStatus(value: any): value is DeliveryStatus {
  return Object.values(DeliveryStatus).includes(value);
}

export function isLoginMethod(value: any): value is LoginMethod {
  return Object.values(LoginMethod).includes(value);
}

export function isClientType(value: any): value is ClientType {
  return Object.values(ClientType).includes(value);
}

export function isEntityType(value: any): value is EntityType {
  return Object.values(EntityType).includes(value);
}

// Validation type guards
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhone(value: string): boolean {
  return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,12}$/.test(value);
}

export function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isCUID(value: string): boolean {
  return /^c[a-z0-9]{24}$/i.test(value);
}

export function isISODate(value: string): boolean {
  const date = new Date(value);
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString() === value;
}

// Utility type guards
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

export function isDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isArray<T>(value: any): value is T[] {
  return Array.isArray(value);
}

export function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isEmptyObject(value: any): boolean {
  return isObject(value) && Object.keys(value).length === 0;
}

export function isEmptyArray(value: any): boolean {
  return isArray(value) && value.length === 0;
}

export function isEmptyString(value: any): boolean {
  return isString(value) && value.trim().length === 0;
}

// Complex type guards
export function hasProperty<T, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return isObject(obj) && key in obj;
}

export function isArrayOf<T>(
  value: any,
  itemGuard: (item: any) => item is T
): value is T[] {
  return isArray(value) && value.every(itemGuard);
}

export function isNonEmptyArray<T>(value: T[]): value is [T, ...T[]] {
  return value.length > 0;
}

export function isNullish(value: any): value is null | undefined {
  return value === null || value === undefined;
}

export function isNotNullish<T>(value: T): value is NonNullable<T> {
  return !isNullish(value);
}

// Error type guards
export function isError(value: any): value is Error {
  return value instanceof Error;
}

export function hasErrorProperty(value: any): value is { error: unknown } {
  return hasProperty(value, 'error');
}

export function hasMessageProperty(value: any): value is { message: string } {
  return hasProperty(value, 'message') && isString(value.message);
}

// API Response type guards
export function isApiError(value: any): value is { error: { message: string; code: string } } {
  return (
    hasProperty(value, 'error') &&
    isObject(value.error) &&
    hasProperty(value.error, 'message') &&
    hasProperty(value.error, 'code') &&
    isString(value.error.message) &&
    isString(value.error.code)
  );
}

export function isApiSuccess<T>(value: any): value is { success: true; data: T } {
  return (
    hasProperty(value, 'success') &&
    value.success === true &&
    hasProperty(value, 'data')
  );
}

// Pagination type guards
export function isPaginationParams(value: any): value is { page: number; limit: number } {
  return (
    isObject(value) &&
    hasProperty(value, 'page') &&
    hasProperty(value, 'limit') &&
    isNumber(value.page) &&
    isNumber(value.limit) &&
    value.page > 0 &&
    value.limit > 0
  );
}