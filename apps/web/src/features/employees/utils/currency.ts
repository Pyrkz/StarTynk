// Import from centralized utils package
import { CurrencyUtils as CurrencyUtilsClass } from '@repo/utils';

// Re-export the entire class with a safer approach for SSG
export const CurrencyUtils = CurrencyUtilsClass;

// Backward compatibility aliases - wrap in functions to avoid SSG issues
export const formatCurrency = (amount: number, currency: string = 'PLN', locale: string = 'pl-PL'): string => {
  // Direct implementation to avoid SSG issues
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const parseCurrency = (value: string): number => {
  // Direct implementation to avoid SSG issues
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  const normalizedValue = cleanValue.replace(',', '.');
  return parseFloat(normalizedValue) || 0;
};