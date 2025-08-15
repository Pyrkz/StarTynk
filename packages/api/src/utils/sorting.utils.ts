export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const ALLOWED_SORT_FIELDS = {
  users: ['firstName', 'lastName', 'email', 'role', 'createdAt', 'updatedAt'],
  projects: ['title', 'status', 'startDate', 'endDate', 'budget', 'createdAt', 'updatedAt'],
  general: ['id', 'createdAt', 'updatedAt']
};

export function applySorting(
  sortOptions: SortOptions,
  allowedFields: string[] = ALLOWED_SORT_FIELDS.general
): Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[] {
  const { sortBy = 'createdAt', sortOrder = 'desc' } = sortOptions;

  // Validate sort field
  if (!allowedFields.includes(sortBy)) {
    return { createdAt: 'desc' };
  }

  // Validate sort order
  const validOrder = sortOrder === 'asc' ? 'asc' : 'desc';

  return { [sortBy]: validOrder };
}

export function getProjectSortFields(): string[] {
  return ALLOWED_SORT_FIELDS.projects;
}

export function getUserSortFields(): string[] {
  return ALLOWED_SORT_FIELDS.users;
}

export function validateSortField(field: string, allowedFields: string[]): boolean {
  return allowedFields.includes(field);
}

export function createMultiSort(sorts: Array<{ field: string; order: 'asc' | 'desc' }>): Record<string, 'asc' | 'desc'>[] {
  return sorts.map(sort => ({ [sort.field]: sort.order }));
}