export interface FilterOptions {
  search?: string;
  status?: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  [key: string]: any;
}

export function applyFilters(filters: FilterOptions = {}): Record<string, any> {
  const where: Record<string, any> = {};

  // Text search filter
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // Status filter
  if (filters.status) {
    where.status = filters.status;
  }

  // Active status filter
  if (typeof filters.isActive === 'boolean') {
    where.isActive = filters.isActive;
  }

  // Date range filters
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  // Role filter
  if (filters.role) {
    where.role = filters.role;
  }

  // ID filters
  if (filters.developerId) {
    where.developerId = filters.developerId;
  }
  if (filters.coordinatorId) {
    where.coordinatorId = filters.coordinatorId;
  }

  // Budget range filters
  if (filters.minBudget || filters.maxBudget) {
    where.budget = {};
    if (filters.minBudget) {
      where.budget.gte = filters.minBudget;
    }
    if (filters.maxBudget) {
      where.budget.lte = filters.maxBudget;
    }
  }

  return where;
}

export function sanitizeFilters<T extends Record<string, any>>(
  filters: T,
  allowedFields: string[]
): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const [key, value] of Object.entries(filters)) {
    if (allowedFields.includes(key) && value !== undefined && value !== null && value !== '') {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}