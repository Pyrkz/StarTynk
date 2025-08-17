import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1),
  
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  
  cursor: z.string().optional(),
});

export const sortingSchema = z.object({
  sortBy: z.string().optional(),
  
  sortOrder: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Sort order must be "asc" or "desc"' })
  }).default('desc'),
});

export const dateFilterSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return data.from <= data.to;
    }
    return true;
  },
  { message: 'From date must be before or equal to To date' }
);

export const searchSchema = z.object({
  q: z.string()
    .min(1, 'Search query must not be empty')
    .max(100, 'Search query too long')
    .optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SortingInput = z.infer<typeof sortingSchema>;
export type DateFilterInput = z.infer<typeof dateFilterSchema>;
export type SearchInput = z.infer<typeof searchSchema>;