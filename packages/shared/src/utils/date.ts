/**
 * Date utility functions
 */

/**
 * Parse a date that could be a Date object or ISO string
 */
export const parseDate = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  return date instanceof Date ? date : new Date(date);
};

/**
 * Format date to ISO string
 */
export const toISOString = (date: Date | string | null | undefined): string | null => {
  const parsed = parseDate(date);
  return parsed ? parsed.toISOString() : null;
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: Date | string): boolean => {
  const parsed = parseDate(date);
  return parsed ? parsed < new Date() : false;
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (date: Date | string): boolean => {
  const parsed = parseDate(date);
  return parsed ? parsed > new Date() : false;
};

/**
 * Get days between two dates
 */
export const daysBetween = (date1: Date | string, date2: Date | string): number => {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  if (!d1 || !d2) return 0;
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Add days to a date
 */
export const addDays = (date: Date | string, days: number): Date => {
  const result = parseDate(date) || new Date();
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Format date for display (Polish locale)
 */
export const formatDatePL = (date: Date | string | null | undefined): string => {
  const parsed = parseDate(date);
  if (!parsed) return '';
  
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(parsed);
};

/**
 * Format date with time for display (Polish locale)
 */
export const formatDateTimePL = (date: Date | string | null | undefined): string => {
  const parsed = parseDate(date);
  if (!parsed) return '';
  
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed);
};