import { Role, ProjectStatus, TaskStatus } from '@repo/database';
import type { ApiResponse, ApiErrorResponse } from '../api/response.types';

/**
 * Database enum type guards
 */
export const isValidRole = (role: unknown): role is Role => {
  return Object.values(Role).includes(role as Role);
};

export const isValidProjectStatus = (status: unknown): status is ProjectStatus => {
  return Object.values(ProjectStatus).includes(status as ProjectStatus);
};

export const isValidTaskStatus = (status: unknown): status is TaskStatus => {
  return Object.values(TaskStatus).includes(status as TaskStatus);
};

/**
 * Primitive type guards
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

/**
 * Null/undefined checks
 */
export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

export const isNull = (value: unknown): value is null => {
  return value === null;
};

export const isUndefined = (value: unknown): value is undefined => {
  return value === undefined;
};

export const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

/**
 * API response type guards
 */
export const isApiResponse = <T = unknown>(value: unknown): value is ApiResponse<T> => {
  return (
    isObject(value) &&
    'success' in value &&
    'data' in value &&
    'timestamp' in value &&
    isBoolean(value.success) &&
    isString(value.timestamp)
  );
};

export const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  return (
    isObject(value) &&
    'success' in value &&
    'error' in value &&
    'timestamp' in value &&
    value.success === false &&
    isObject(value.error) &&
    'code' in value.error &&
    'message' in value.error &&
    isString(value.timestamp)
  );
};

/**
 * ID format validation
 */
export const isCuid = (value: unknown): value is string => {
  return isString(value) && /^c[0-9a-z]{24}$/.test(value);
};

export const isUuid = (value: unknown): value is string => {
  return isString(value) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

/**
 * Email validation
 */
export const isEmail = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * URL validation
 */
export const isUrl = (value: unknown): value is string => {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Phone number validation (basic)
 */
export const isPhoneNumber = (value: unknown): value is string => {
  if (!isString(value)) return false;
  // Basic phone number pattern (can be enhanced with libphonenumber-js)
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(value);
};

/**
 * Generic array type guard with element validation
 */
export const isArrayOf = <T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is T[] => {
  return isArray(value) && value.every(itemGuard);
};

/**
 * Non-empty string type guard
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return isString(value) && value.trim().length > 0;
};

/**
 * Positive number type guard
 */
export const isPositiveNumber = (value: unknown): value is number => {
  return isNumber(value) && value > 0;
};

/**
 * Integer type guard
 */
export const isInteger = (value: unknown): value is number => {
  return isNumber(value) && Number.isInteger(value);
};

/**
 * Date string type guard (ISO format)
 */
export const isDateString = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value === date.toISOString();
};

/**
 * Safe JSON parsing type guard
 */
export const isJsonString = (value: unknown): value is string => {
  if (!isString(value)) return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * File type guards
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf';
};

export const isDocumentFile = (file: File): boolean => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  return documentTypes.includes(file.type);
};