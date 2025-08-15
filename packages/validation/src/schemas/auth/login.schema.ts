import { z } from 'zod';
import { emailValidator, passwordValidator } from '../../validators';

export const loginSchema = z.object({
  email: emailValidator,
  password: z.string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;