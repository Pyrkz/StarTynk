import { z } from 'zod';
import { emailValidator, passwordValidator, phoneValidatorOptional } from '../../validators';
import { Role } from '@repo/database';

// Registration with comprehensive validation
export const registerSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
  confirmPassword: z.string(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/, 'Name contains invalid characters')
    .transform(s => s.trim()),
  phone: phoneValidatorOptional,
  role: z.nativeEnum(Role).default(Role.WORKER),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  invitationCode: z.string().optional(),
  metadata: z.object({
    source: z.enum(['web', 'mobile', 'admin']),
    deviceInfo: z.object({
      platform: z.string(),
      version: z.string(),
    }).optional(),
    referrer: z.string().url().optional(),
  }).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Invitation schema with role-based permissions
export const inviteUserSchema = z.object({
  email: emailValidator,
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Invalid role' })
  }),
  permissions: z.array(z.string()).optional(),
  projects: z.array(z.string().uuid()).optional(),
  message: z.string()
    .max(500, 'Message must not exceed 500 characters')
    .optional(),
  expiresAt: z.coerce.date().optional(),
});

// Email verification
export const verifyEmailSchema = z.object({
  token: z.string().length(64),
  email: emailValidator,
});

// Account activation
export const activateAccountSchema = z.object({
  token: z.string().length(64),
  password: passwordValidator,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;