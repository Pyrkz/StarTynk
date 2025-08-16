import { z } from 'zod';

export const dateSchema = z.coerce.date({
  errorMap: () => ({ message: 'Please enter a valid date' })
});

export const futureDateSchema = z.coerce.date()
  .refine(
    (date) => date > new Date(),
    'Date must be in the future'
  );

export const pastDateSchema = z.coerce.date()
  .refine(
    (date) => date < new Date(),
    'Date must be in the past'
  );

export const birthDateSchema = z.coerce.date()
  .refine(
    (date) => {
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return age >= 18 && age <= 100;
    },
    'Must be between 18 and 100 years old'
  );

export const workingDateSchema = z.coerce.date()
  .refine(
    (date) => {
      // Check if date is not too far in the past or future
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 10, 0, 1);
      const maxDate = new Date(now.getFullYear() + 5, 11, 31);
      return date >= minDate && date <= maxDate;
    },
    'Date must be within reasonable business range'
  );

// Date range validation
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Time slot validation
export const timeSlotSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
}).refine(data => {
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes > startMinutes;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// Business hours validation
export const businessHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  isClosed: z.boolean().default(false),
});

export type DateInput = z.infer<typeof dateSchema>;
export type FutureDateInput = z.infer<typeof futureDateSchema>;
export type PastDateInput = z.infer<typeof pastDateSchema>;
export type BirthDateInput = z.infer<typeof birthDateSchema>;
export type WorkingDateInput = z.infer<typeof workingDateSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type TimeSlotInput = z.infer<typeof timeSlotSchema>;
export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;