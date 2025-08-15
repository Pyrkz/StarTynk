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
      return age >= 0 && age <= 150;
    },
    'Please enter a valid birth date'
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

export type DateInput = z.infer<typeof dateSchema>;
export type FutureDateInput = z.infer<typeof futureDateSchema>;
export type PastDateInput = z.infer<typeof pastDateSchema>;
export type BirthDateInput = z.infer<typeof birthDateSchema>;
export type WorkingDateInput = z.infer<typeof workingDateSchema>;