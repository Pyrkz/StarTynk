import { z } from 'zod';
import { emailValidator, passwordValidator, phoneValidator } from '../../validators';

// Login schemas with multiple methods
export const loginSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('email'),
    email: emailValidator,
    password: passwordValidator,
    deviceId: z.string().uuid().optional(),
    rememberMe: z.boolean().default(false),
  }),
  z.object({
    method: z.literal('phone'),
    phone: phoneValidator,
    password: passwordValidator,
    deviceId: z.string().uuid().optional(),
  }),
  z.object({
    method: z.literal('biometric'),
    deviceId: z.string().uuid(),
    biometricToken: z.string().min(64),
  }),
]);

// Token refresh with security checks
export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(64, 'Invalid refresh token format')
    .regex(/^[A-Za-z0-9+/]+=*$/, 'Invalid token encoding'),
  deviceId: z.string().uuid(),
  fingerprint: z.string().optional(), // Browser/device fingerprint
});

// Logout with cleanup support
export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
  deviceId: z.string().uuid().optional(),
  logoutFromAllDevices: z.boolean().default(false),
});

// Two-factor authentication
export const twoFactorSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
  trustDevice: z.boolean().default(false),
});

// Session validation
export const sessionValidationSchema = z.object({
  sessionToken: z.string().min(64),
  deviceId: z.string().uuid(),
  ipAddress: z.string().ip().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type TwoFactorInput = z.infer<typeof twoFactorSchema>;
export type SessionValidationInput = z.infer<typeof sessionValidationSchema>;