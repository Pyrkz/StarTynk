import { z } from 'zod';
import { emailValidator, phoneValidator } from '../common';

export const UnifiedLoginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Identifier is required')
    .refine(
      (val) => {
        return (
          emailValidator.safeParse(val).success ||
          phoneValidator.safeParse(val).success
        );
      },
      { message: 'Must be a valid email or phone number' }
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters'),
  clientType: z.enum(['web', 'mobile']).optional().default('web'),
  deviceId: z.string().uuid('Invalid device ID').optional(),
  rememberMe: z.boolean().optional().default(false),
});

export type UnifiedLoginInput = z.infer<typeof UnifiedLoginSchema>;