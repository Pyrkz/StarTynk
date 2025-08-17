import { z } from 'zod';
import { emailSchema, phoneSchema, idSchema, paginationSchema, searchSchema, sortSchema } from './common.validators';

export const createUserSchema = z.object({
  email: emailSchema,
  phone: phoneSchema.optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR', 'COORDINATOR', 'WORKER', 'DEVELOPER', 'PROJECT_MANAGER']),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR', 'COORDINATOR', 'WORKER', 'DEVELOPER', 'PROJECT_MANAGER']).optional(),
  isActive: z.boolean().optional(),
});

export const listUsersSchema = paginationSchema.merge(searchSchema).merge(sortSchema).merge(z.object({
  role: z.enum(['USER', 'ADMIN', 'MODERATOR', 'COORDINATOR', 'WORKER', 'DEVELOPER', 'PROJECT_MANAGER']).optional(),
  isActive: z.coerce.boolean().optional(),
}));

export const getUserSchema = z.object({
  id: idSchema,
});

export const deleteUserSchema = z.object({
  id: idSchema,
});

export const updateUserPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type GetUserInput = z.infer<typeof getUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
export type UpdateUserPasswordInput = z.infer<typeof updateUserPasswordSchema>;