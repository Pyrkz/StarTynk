import { Type, Static } from '@sinclair/typebox';

// Login schema
export const LoginSchema = Type.Object({
  identifier: Type.String({ 
    minLength: 1,
    description: 'Email or phone number' 
  }),
  password: Type.String({ 
    minLength: 6,
    description: 'User password' 
  }),
});

export type LoginInput = Static<typeof LoginSchema>;

// Refresh token schema
export const RefreshTokenSchema = Type.Object({
  refreshToken: Type.Optional(Type.String({
    description: 'Refresh token from cookie or body'
  })),
});

export type RefreshTokenInput = Static<typeof RefreshTokenSchema>;

// Response schemas
export const AuthResponseSchema = Type.Object({
  user: Type.Object({
    id: Type.String(),
    name: Type.Union([Type.String(), Type.Null()]),
    email: Type.String(),
    phone: Type.Union([Type.String(), Type.Null()]),
    role: Type.String(),
    isActive: Type.Boolean(),
    position: Type.Union([Type.String(), Type.Null()]),
    department: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
  }),
  accessToken: Type.String(),
});

export const ErrorResponseSchema = Type.Object({
  statusCode: Type.Number(),
  error: Type.String(),
  message: Type.String(),
});