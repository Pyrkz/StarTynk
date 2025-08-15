import React from 'react'
import { Button } from '@/components/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface UsersPaginationProps {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  loading: boolean
  onPageChange: (page: number) => void
}

const UsersPagination: React.FC<UsersPaginationProps> = ({
  currentPage,
  totalPages,
  total,
  pageSize,
  loading,
  onPageChange,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, total)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxPagesToShow = 7
    const halfRange = Math.floor(maxPagesToShow / 2)

    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    pages.push(1)

    if (currentPage > halfRange + 1) {
      pages.push('...')
    }

    const start = Math.max(2, currentPage - halfRange)
    const end = Math.min(totalPages - 1, currentPage + halfRange)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - halfRange) {
      pages.push('...')
    }

    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 px-3 py-2 sm:px-4 sm:py-3 lg:px-6 mt-4 sm:mt-6 mb-6">
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs sm:text-sm text-neutral-700 text-center sm:text-left">
          Wyświetlanie <span className="font-medium">{startItem}</span> -{' '}
          <span className="font-medium">{endItem}</span> z{' '}
          <span className="font-medium">{total}</span>
        </div>
        
        <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || loading}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-2"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Poprzednia strona</span>
          </Button>

          <div className="hidden sm:flex items-center space-x-1">
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-neutral-500">...</span>
                ) : (
                  <Button
                    variant={page === currentPage ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    disabled={loading}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="sm:hidden flex items-center px-2">
            <span className="text-xs text-neutral-700 font-medium">
              {currentPage}/{totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || loading}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-2"
          >
            <span className="sr-only">Następna strona</span>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UsersPagination