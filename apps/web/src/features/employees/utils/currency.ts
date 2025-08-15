// Re-export from centralized utils package
export { CurrencyUtils } from '@repo/utils';

// Backward compatibility aliases
export const formatCurrency = CurrencyUtils.formatCurrency;
export const parseCurrency = CurrencyUtils.parseCurrency;