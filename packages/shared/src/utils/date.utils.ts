/**
 * Date utility functions for consistent date handling across the application
 */

/**
 * Format date to Polish locale string
 */
export const formatDatePL = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('pl-PL');
};

/**
 * Format date and time to Polish locale string
 */
export const formatDateTimePL = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('pl-PL');
};

/**
 * Format date to ISO string (for API)
 */
export const formatDateISO = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString();
};

/**
 * Format date for display (human readable)
 */
export const formatDateForDisplay = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  if (diff < minute) {
    return 'przed chwilą';
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} ${minutes === 1 ? 'minuta' : 'minut'} temu`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} ${hours === 1 ? 'godzina' : 'godzin'} temu`;
  } else if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days} ${days === 1 ? 'dzień' : 'dni'} temu`;
  } else if (diff < month) {
    const weeks = Math.floor(diff / week);
    return `${weeks} ${weeks === 1 ? 'tydzień' : 'tygodni'} temu`;
  } else if (diff < year) {
    const months = Math.floor(diff / month);
    return `${months} ${months === 1 ? 'miesiąc' : 'miesięcy'} temu`;
  } else {
    const years = Math.floor(diff / year);
    return `${years} ${years === 1 ? 'rok' : 'lat'} temu`;
  }
};

/**
 * Check if date is today
 */
export const isToday = (date: Date | string): boolean => {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

/**
 * Check if date is yesterday
 */
export const isYesterday = (date: Date | string): boolean => {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
};

/**
 * Check if date is in the past
 */
export const isPastDate = (date: Date | string): boolean => {
  const d = new Date(date);
  const now = new Date();
  return d < now;
};

/**
 * Check if date is in the future
 */
export const isFutureDate = (date: Date | string): boolean => {
  const d = new Date(date);
  const now = new Date();
  return d > now;
};

/**
 * Get start of day
 */
export const getStartOfDay = (date: Date | string): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of day
 */
export const getEndOfDay = (date: Date | string): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get start of week (Monday)
 */
export const getStartOfWeek = (date: Date | string): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff));
};

/**
 * Get end of week (Sunday)
 */
export const getEndOfWeek = (date: Date | string): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Sunday
  return new Date(d.setDate(diff));
};

/**
 * Get start of month
 */
export const getStartOfMonth = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

/**
 * Get end of month
 */
export const getEndOfMonth = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
};

/**
 * Add days to date
 */
export const addDays = (date: Date | string, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Add months to date
 */
export const addMonths = (date: Date | string, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

/**
 * Add years to date
 */
export const addYears = (date: Date | string, years: number): Date => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

/**
 * Calculate difference in days
 */
export const diffInDays = (date1: Date | string, date2: Date | string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: Date | string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};