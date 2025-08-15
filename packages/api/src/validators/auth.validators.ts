import { z } from 'zod';
import { emailSchema, phoneSchema } from './common.validators';

export const loginSchema = z.object({
  loginMethod: z.enum(['email', 'phone']),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(data => {
  if (data.loginMethod === 'email' && !data.email) {
    return false;
  }
  if (data.loginMethod === 'phone' && !data.phone) {
    return false;
  }
  return true;
}, {
  message: 'Email or phone is required based on login method',
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'COORDINATOR']).optional(),
});

export const otpVerificationSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OtpVerificationInput = z.infer<typeof otpVerificationSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;