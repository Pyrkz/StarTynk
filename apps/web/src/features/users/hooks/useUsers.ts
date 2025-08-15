'use client'

import { useUsers as useSharedUsers, useUpdateUser, useDeleteUser } from '@repo/features/users'
import { UserFilters } from '@/features/users/types'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UseUsersOptions {
  initialFilters?: UserFilters
  autoFetch?: boolean
}

export function useUsers(options: UseUsersOptions = {}) {
  const router = useRouter()
  const { initialFilters = {}, autoFetch = true } = options

  // Use shared hook with web-specific options
  const {
    users,
    total,
    isLoading: loading,
    error,
    filters,
    setFilters,
    refetch: fetchUsers,
    pagination,
  } = useSharedUsers({
    initialFilters: {
      search: initialFilters.search,
      role: initialFilters.role === 'ALL' ? undefined : initialFilters.role,
      isActive: initialFilters.isActive === 'ALL' ? undefined : initialFilters.isActive,
    },
    pageSize: initialFilters.pageSize || 10,
  })

  // Use shared mutations
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()

  // Auto fetch on mount if needed
  useEffect(() => {
    if (autoFetch && !users.length && !loading) {
      fetchUsers()
    }
  }, [autoFetch])

  // Handle pagination changes from filters
  useEffect(() => {
    if (initialFilters.page && initialFilters.page !== pagination.page) {
      pagination.goToPage(initialFilters.page)
    }
  }, [initialFilters.page])

  // Web-specific update user wrapper
  const updateUser = async (userId: string, data: any) => {
    try {
      const result = await updateUserMutation.mutateAsync({ id: userId, data })
      return result
    } catch (err) {
      throw err
    }
  }

  // Web-specific delete user wrapper
  const deleteUser = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId)
      await fetchUsers()
    } catch (err) {
      throw err
    }
  }

  return {
    users,
    total,
    loading,
    error: error ? error.message : null,
    filters: {
      ...filters,
      role: filters.role || 'ALL',
      isActive: filters.isActive ?? 'ALL',
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
    setFilters: (newFilters: UserFilters) => {
      setFilters({
        search: newFilters.search,
        role: newFilters.role === 'ALL' ? undefined : newFilters.role,
        isActive: newFilters.isActive === 'ALL' ? undefined : newFilters.isActive,
      })
      if (newFilters.page) {
        pagination.goToPage(newFilters.page)
      }
      if (newFilters.pageSize) {
        pagination.changePageSize(newFilters.pageSize)
      }
    },
    fetchUsers,
    updateUser,
    deleteUser,
  }
}