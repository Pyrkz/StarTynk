/**
 * Currency utility functions
 */
export class CurrencyUtils {
  /**
   * Format a number as currency in PLN (Polish Zloty)
   */
  static formatCurrency(amount: number, currency = 'PLN', locale = 'pl-PL'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Parse a currency string to a number
   */
  static parseCurrency(value: string): number {
    // Remove currency symbol and spaces
    const cleanValue = value.replace(/[^\d,.-]/g, '');
    // Replace comma with dot for parsing
    const normalizedValue = cleanValue.replace(',', '.');
    return parseFloat(normalizedValue) || 0;
  }

  /**
   * Format amount with thousands separator (no currency symbol)
   */
  static formatAmount(amount: number, locale = 'pl-PL', decimals = 2): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  }

  /**
   * Convert cents to currency amount
   */
  static centsToAmount(cents: number): number {
    return cents / 100;
  }

  /**
   * Convert currency amount to cents
   */
  static amountToCents(amount: number): number {
    return Math.round(amount * 100);
  }
}