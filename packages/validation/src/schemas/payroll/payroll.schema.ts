import { z } from 'zod';
import { moneySchema, dateRangeSchema, percentageSchema, taxRateSchema } from '../common';

// Hourly rate configuration
export const hourlyRateSchema = z.object({
  regular: moneySchema,
  overtime: moneySchema,
  weekend: moneySchema,
  holiday: moneySchema,
  night: moneySchema.optional(), // Night shift differential
});

// Payroll calculation input
export const payrollCalculationSchema = z.object({
  userId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  period: dateRangeSchema,
  
  hours: z.object({
    regular: z.number().min(0).max(300),
    overtime: z.number().min(0).max(100),
    weekend: z.number().min(0).max(100),
    holiday: z.number().min(0).max(50),
    night: z.number().min(0).max(100).optional(),
  }),
  
  rates: hourlyRateSchema,
  
  deductions: z.array(z.object({
    type: z.enum(['tax', 'social_security', 'health_insurance', 'pension', 'other']),
    name: z.string().max(100),
    amount: moneySchema,
    percentage: percentageSchema.optional(),
  })).optional(),
  
  bonuses: z.array(z.object({
    type: z.enum(['performance', 'project_completion', 'referral', 'other']),
    description: z.string().max(200),
    amount: moneySchema,
    taxable: z.boolean().default(true),
  })).optional(),
  
  advances: z.array(z.object({
    date: z.coerce.date(),
    amount: moneySchema,
    description: z.string().max(200).optional(),
  })).optional(),
});

// Payroll entry
export const payrollEntrySchema = z.object({
  employeeId: z.string().uuid(),
  period: dateRangeSchema,
  
  earnings: z.object({
    basicPay: moneySchema,
    overtimePay: moneySchema,
    weekendPay: moneySchema,
    holidayPay: moneySchema,
    nightShiftPay: moneySchema.optional(),
    bonuses: moneySchema,
    total: moneySchema,
  }),
  
  deductions: z.object({
    incomeTax: moneySchema,
    socialSecurity: moneySchema,
    healthInsurance: moneySchema,
    pension: moneySchema.optional(),
    other: moneySchema.optional(),
    total: moneySchema,
  }),
  
  netPay: moneySchema,
  
  hoursWorked: z.object({
    regular: z.number(),
    overtime: z.number(),
    weekend: z.number(),
    holiday: z.number(),
    total: z.number(),
  }),
  
  paymentMethod: z.enum(['bank_transfer', 'cash', 'check']).default('bank_transfer'),
  paymentStatus: z.enum(['pending', 'processing', 'paid', 'failed']).default('pending'),
  paymentDate: z.coerce.date().optional(),
  
  notes: z.string().max(500).optional(),
}).refine(data => {
  const calculatedNet = data.earnings.total - data.deductions.total;
  return Math.abs(calculatedNet - data.netPay) < 0.01; // Allow for rounding differences
}, 'Net pay calculation mismatch');

// Bulk payroll generation
export const bulkPayrollSchema = z.object({
  period: dateRangeSchema,
  projectId: z.string().uuid().optional(),
  employeeIds: z.array(z.string().uuid()).min(1).max(500),
  paymentDate: z.coerce.date(),
  approvedBy: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

// Payroll report
export const payrollReportSchema = z.object({
  period: dateRangeSchema,
  groupBy: z.enum(['employee', 'project', 'department', 'payment_method']).default('employee'),
  includeDetails: z.boolean().default(false),
  format: z.enum(['summary', 'detailed', 'tax_report', 'bank_file']).default('summary'),
  projectIds: z.array(z.string().uuid()).optional(),
  employeeIds: z.array(z.string().uuid()).optional(),
});

export type HourlyRateInput = z.infer<typeof hourlyRateSchema>;
export type PayrollCalculationInput = z.infer<typeof payrollCalculationSchema>;
export type PayrollEntryInput = z.infer<typeof payrollEntrySchema>;
export type BulkPayrollInput = z.infer<typeof bulkPayrollSchema>;
export type PayrollReportInput = z.infer<typeof payrollReportSchema>;