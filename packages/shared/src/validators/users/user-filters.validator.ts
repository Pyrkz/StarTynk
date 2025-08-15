import { z } from 'zod';
import { PaginationSchema } from '../common';

export const UserFiltersSchema = PaginationSchema.extend({
  search: z.string().optional(),
  role: z.enum(['USER', 'PROFESSIONAL', 'ADMIN']).optional(),
  isActive: z.coerce.boolean().optional(),
  isVerified: z.coerce.boolean().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});

export type UserFiltersInput = z.infer<typeof UserFiltersSchema>;