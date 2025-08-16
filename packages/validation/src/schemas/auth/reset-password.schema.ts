import { z } from 'zod';
import { emailValidator, passwordValidator, phoneValidator } from '../../validators';

// Request password reset via email or phone
export const resetPasswordRequestSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('email'),
    email: emailValidator,
    captchaToken: z.string().optional(), // For bot protection
  }),
  z.object({
    method: z.literal('phone'),
    phone: phoneValidator,
    captchaToken: z.string().optional(),
  }),
]);

// Password reset with strength requirements
export const resetPasswordSchema = z.object({
  token: z.string().length(64),
  newPassword: passwordValidator,
  confirmPassword: z.string(),
  deviceId: z.string().uuid().optional(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Change password for authenticated user
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: passwordValidator,
  confirmPassword: z.string(),
  logoutOtherDevices: z.boolean().default(false),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

// Validate reset token
export const validateResetTokenSchema = z.object({
  token: z.string().length(64),
});

// Security questions for password recovery
export const securityQuestionsSchema = z.object({
  userId: z.string().uuid(),
  questions: z.array(z.object({
    questionId: z.string(),
    answer: z.string().min(1).max(100),
  })).min(2).max(3),
});

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ValidateResetTokenInput = z.infer<typeof validateResetTokenSchema>;
export type SecurityQuestionsInput = z.infer<typeof securityQuestionsSchema>;