import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  total?: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, initialPageSize = 10, total = 0 } = options;
  
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(() => {
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);

  const hasPrevious = useMemo(() => page > 1, [page]);
  const hasNext = useMemo(() => page < totalPages, [page, totalPages]);

  const goToPage = useCallback((newPage: number) => {
    const pageNumber = Math.max(1, Math.min(newPage, totalPages || 1));
    setPage(pageNumber);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNext) {
      goToPage(page + 1);
    }
  }, [page, hasNext, goToPage]);

  const previousPage = useCallback(() => {
    if (hasPrevious) {
      goToPage(page - 1);
    }
  }, [page, hasPrevious, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [totalPages, goToPage]);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const getPaginationParams = useCallback(() => ({
    page,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }), [page, pageSize]);

  const getPageNumbers = useCallback((maxVisible = 5) => {
    const pages: number[] = [];
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [page, totalPages]);

  return {
    // State
    page,
    pageSize,
    totalPages,
    total,
    hasPrevious,
    hasNext,
    
    // Actions
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    changePageSize,
    
    // Utilities
    getPaginationParams,
    getPageNumbers,
    
    // Range info
    startIndex: (page - 1) * pageSize,
    endIndex: Math.min(page * pageSize, total),
  };
}