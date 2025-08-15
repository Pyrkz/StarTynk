import { z } from 'zod';
import { emailValidator, phoneValidator } from '../common';

export const CreateUserSchema = z.object({
  email: emailValidator,
  phone: phoneValidator,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters'),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters'),
  role: z.enum(['USER', 'PROFESSIONAL', 'ADMIN']).default('USER'),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;