export class NumberUtils {
  /**
   * Format number as currency (PLN)
   */
  static formatCurrency(amount: number, currency = 'PLN', locale = 'pl-PL'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format number with thousands separator
   */
  static formatThousands(num: number, locale = 'pl-PL'): string {
    return new Intl.NumberFormat(locale).format(num);
  }

  /**
   * Format as percentage
   */
  static formatPercentage(num: number, decimals = 1, locale = 'pl-PL'): string {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num / 100);
  }

  /**
   * Round to specified decimal places
   */
  static round(num: number, decimals = 2): number {
    return Math.round((num + Number.EPSILON) * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Check if number is between min and max (inclusive)
   */
  static isBetween(num: number, min: number, max: number): boolean {
    return num >= min && num <= max;
  }

  /**
   * Clamp number between min and max
   */
  static clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  }

  /**
   * Generate random number between min and max
   */
  static random(min = 0, max = 1): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Check if number is even
   */
  static isEven(num: number): boolean {
    return num % 2 === 0;
  }

  /**
   * Check if number is odd
   */
  static isOdd(num: number): boolean {
    return num % 2 !== 0;
  }

  /**
   * Calculate percentage
   */
  static percentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  }

  /**
   * Calculate average
   */
  static average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Find sum of array
   */
  static sum(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0);
  }

  /**
   * Find minimum value
   */
  static min(numbers: number[]): number {
    return Math.min(...numbers);
  }

  /**
   * Find maximum value
   */
  static max(numbers: number[]): number {
    return Math.max(...numbers);
  }

  /**
   * Convert bytes to human readable format
   */
  static formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Convert seconds to human readable duration
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  /**
   * Parse string to number safely
   */
  static parseNumber(value: string | number): number | null {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return null;
    
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Check if value is a valid number
   */
  static isValidNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }
}