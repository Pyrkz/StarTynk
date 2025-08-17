'use client'

import { useUsers as useSharedUsers, useUpdateUser, useDeleteUser } from '@repo/features'
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
    pageSize: initialFilters.pageSize || 20,
  })

  // Use shared mutations
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()

  // Auto fetch on mount if needed - only in client
  useEffect(() => {
    if (typeof window !== 'undefined' && autoFetch && !users.length && !loading) {
      fetchUsers()
    }
  }, [autoFetch, users.length, loading, fetchUsers])

  // Handle initial page setup - only once on mount in client
  useEffect(() => {
    if (typeof window !== 'undefined' && initialFilters.page && initialFilters.page !== pagination.page) {
      pagination.goToPage(initialFilters.page)
    }
  }, []) // Empty dependency array to run only once

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
      // Only update filters if they have changed
      const normalizedRole = newFilters.role === 'ALL' ? undefined : newFilters.role
      const normalizedIsActive = newFilters.isActive === 'ALL' ? undefined : newFilters.isActive
      
      // Check if filters actually changed
      const filtersChanged = 
        filters.search !== newFilters.search ||
        filters.role !== normalizedRole ||
        filters.isActive !== normalizedIsActive
      
      if (filtersChanged) {
        setFilters({
          search: newFilters.search,
          role: normalizedRole,
          isActive: normalizedIsActive,
        })
      }
      
      // Only update page if it changed
      if (newFilters.page && newFilters.page !== pagination.page) {
        pagination.goToPage(newFilters.page)
      }
      
      // Only update pageSize if it changed
      if (newFilters.pageSize && newFilters.pageSize !== pagination.pageSize) {
        pagination.changePageSize(newFilters.pageSize)
      }
    },
    fetchUsers,
    updateUser,
    deleteUser,
  }
}