export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
}

export function applyPagination(page: number = 1, limit: number = 20): PaginationResult {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));
  
  return {
    skip: (validPage - 1) * validLimit,
    take: validLimit
  };
}

export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    isFirstPage: page === 1,
    isLastPage: page === totalPages
  };
}