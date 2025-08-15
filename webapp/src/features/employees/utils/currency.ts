/**
 * Format a number as currency in PLN (Polish Zloty)
 * @param amount The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse a currency string to a number
 * @param value The currency string to parse
 * @returns The parsed number value
 */
export function parseCurrency(value: string): number {
  // Remove currency symbol and spaces
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  // Replace comma with dot for parsing
  const normalizedValue = cleanValue.replace(',', '.');
  return parseFloat(normalizedValue) || 0;
}