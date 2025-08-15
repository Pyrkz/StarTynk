import { z } from 'zod';
import { emailValidator, passwordValidator, phoneValidatorOptional } from '../../validators';
import { Role } from '@repo/database';

export const createUserSchema = z.object({
  email: emailValidator,
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/, 'Name contains invalid characters'),
  
  password: passwordValidator,
  
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Invalid role' })
  }),
  
  phone: phoneValidatorOptional,
  
  position: z.string()
    .min(2, 'Position must be at least 2 characters')
    .max(100, 'Position must not exceed 100 characters')
    .optional(),
  
  department: z.string()
    .min(2, 'Department must be at least 2 characters')
    .max(100, 'Department must not exceed 100 characters')
    .optional(),
  
  employmentStartDate: z.coerce.date()
    .max(new Date(), 'Start date cannot be in the future')
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Partial schema for updates
export const updateUserSchema = createUserSchema
  .omit({ email: true, password: true })
  .partial();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;