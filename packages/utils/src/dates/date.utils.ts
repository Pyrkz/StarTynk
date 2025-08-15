import { format, parse, isValid, differenceInDays, addDays, startOfDay, endOfDay, isWeekend } from 'date-fns';
import { pl } from 'date-fns/locale';

export class DateUtils {
  static readonly DEFAULT_FORMAT = 'yyyy-MM-dd';
  static readonly DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
  static readonly DISPLAY_FORMAT = 'dd.MM.yyyy';
  static readonly DISPLAY_DATETIME_FORMAT = 'dd.MM.yyyy HH:mm';

  static format(date: Date | string | null | undefined, formatStr?: string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(d)) return '';
    return format(d, formatStr || this.DEFAULT_FORMAT, { locale: pl });
  }

  static parse(dateString: string, formatStr?: string): Date | null {
    try {
      const parsed = parse(dateString, formatStr || this.DEFAULT_FORMAT, new Date());
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  static isValid(date: any): boolean {
    if (!date) return false;
    const d = typeof date === 'string' ? new Date(date) : date;
    return isValid(d);
  }

  static daysBetween(start: Date, end: Date): number {
    return Math.abs(differenceInDays(start, end));
  }

  static addBusinessDays(date: Date, days: number): Date {
    let result = new Date(date);
    let daysAdded = 0;
    
    while (daysAdded < days) {
      result = addDays(result, 1);
      if (!isWeekend(result)) {
        daysAdded++;
      }
    }
    
    return result;
  }

  static isWeekend(date: Date): boolean {
    return isWeekend(date);
  }

  static startOfDay(date: Date): Date {
    return startOfDay(date);
  }

  static endOfDay(date: Date): Date {
    return endOfDay(date);
  }

  static toISOString(date: Date): string {
    return date.toISOString();
  }

  static fromISOString(isoString: string): Date {
    return new Date(isoString);
  }

  static now(): Date {
    return new Date();
  }

  static today(): Date {
    return startOfDay(new Date());
  }

  static tomorrow(): Date {
    return addDays(this.today(), 1);
  }

  static yesterday(): Date {
    return addDays(this.today(), -1);
  }

  /**
   * Format date for display (Polish format)
   */
  static formatForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(d)) return '-';
    return d.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /**
   * Format time for display (Polish format)
   */
  static formatTimeForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(d)) return '-';
    return d.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format datetime for display (Polish format)
   */
  static formatDateTimeForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(d)) return '-';
    return d.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Check if a date is in the past
   */
  static isPast(date: Date): boolean {
    return date < new Date();
  }

  /**
   * Check if a date is in the future
   */
  static isFuture(date: Date): boolean {
    return date > new Date();
  }

  /**
   * Check if a date is today
   */
  static isToday(date: Date): boolean {
    const today = this.today();
    const compareDate = startOfDay(date);
    return today.getTime() === compareDate.getTime();
  }
}