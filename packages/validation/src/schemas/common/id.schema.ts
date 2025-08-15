import { z } from 'zod';

export const idSchema = z.string()
  .min(1, 'ID is required')
  .refine(
    (id) => /^[a-zA-Z0-9_-]+$/.test(id),
    'ID must contain only alphanumeric characters, hyphens, and underscores'
  );

export const cuidSchema = z.string()
  .min(1, 'ID is required')
  .refine(
    (id) => /^c[0-9a-z]{24}$/.test(id),
    'Invalid CUID format'
  );

export const uuidSchema = z.string()
  .min(1, 'ID is required')
  .uuid('Invalid UUID format');

export type IdInput = z.infer<typeof idSchema>;
export type CuidInput = z.infer<typeof cuidSchema>;
export type UuidInput = z.infer<typeof uuidSchema>;