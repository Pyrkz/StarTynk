import { z } from 'zod';

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  deviceId: z.string().uuid('Invalid device ID').optional(),
});

export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer'),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;