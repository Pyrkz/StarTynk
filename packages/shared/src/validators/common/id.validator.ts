import { z } from 'zod';

export const IdSchema = z.string().cuid('Invalid ID format');
export const UuidSchema = z.string().uuid('Invalid UUID format');
export const OptionalIdSchema = IdSchema.optional();
export const OptionalUuidSchema = UuidSchema.optional();