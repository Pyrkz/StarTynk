import { z } from 'zod';

// Money/currency validation
export const moneySchema = z.number()
  .min(0, 'Amount cannot be negative')
  .max(999999999.99, 'Amount too large')
  .multipleOf(0.01, 'Invalid currency precision')
  .transform(val => Math.round(val * 100) / 100); // Ensure 2 decimal places

// Money with currency
export const moneyWithCurrencySchema = z.object({
  amount: moneySchema,
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']).default('PLN'),
});

// Money range
export const moneyRangeSchema = z.object({
  min: moneySchema,
  max: moneySchema,
}).refine(data => data.max >= data.min, {
  message: 'Maximum amount must be greater than minimum',
  path: ['max'],
});

// Percentage (0-100)
export const percentageSchema = z.number()
  .min(0, 'Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100')
  .multipleOf(0.01, 'Invalid percentage precision');

// Tax rate
export const taxRateSchema = z.object({
  rate: percentageSchema,
  name: z.string().min(1).max(50),
  code: z.string().regex(/^[A-Z]{2,3}$/, 'Invalid tax code'),
});

// Invoice amount with tax calculation
export const invoiceAmountSchema = z.object({
  net: moneySchema,
  tax: moneySchema,
  gross: moneySchema,
}).refine(data => {
  const calculated = Math.round((data.net + data.tax) * 100) / 100;
  return calculated === data.gross;
}, {
  message: 'Gross amount does not match net + tax',
  path: ['gross'],
});