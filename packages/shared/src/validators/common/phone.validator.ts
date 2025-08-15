import { z } from 'zod';

export const phoneValidator = z
  .string()
  .regex(
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,12}$/,
    'Invalid phone number format'
  )
  .transform((val) => val.replace(/[^\d+]/g, ''));