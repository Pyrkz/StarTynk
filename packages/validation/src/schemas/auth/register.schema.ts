import { z } from 'zod';
import { emailValidator, passwordValidator, phoneValidatorOptional } from '../../validators';
import { Role } from '@repo/database';

export const registerSchema = z.object({
  email: emailValidator,
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/, 'Name contains invalid characters'),
  
  password: passwordValidator,
  confirmPassword: z.string()
    .min(1, 'Password confirmation is required'),
  
  phone: phoneValidatorOptional,
  
  invitationCode: z.string()
    .min(1, 'Invitation code is required'),
    
  termsAccepted: z.boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export const inviteUserSchema = z.object({
  email: emailValidator,
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Invalid role' })
  }),
  message: z.string()
    .max(500, 'Message must not exceed 500 characters')
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;