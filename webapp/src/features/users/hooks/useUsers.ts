'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserFilters, UsersListResponse, UserWithRelations, UpdateUserDTO } from '@/features/users/types'

interface UseUsersOptions {
  initialFilters?: UserFilters
  autoFetch?: boolean
}

export function useUsers(options: UseUsersOptions = {}) {
  const { initialFilters = {}, autoFetch = true } = options
  const [users, setUsers] = useState<UserWithRelations[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<UserFilters>(initialFilters)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.role && filters.role !== 'ALL') params.append('role', filters.role)
      if (filters.isActive !== undefined && filters.isActive !== 'ALL') {
        params.append('isActive', String(filters.isActive))
      }
      if (filters.department) params.append('department', filters.department)
      if (filters.hasLogin !== undefined) params.append('hasLogin', String(filters.hasLogin))
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
      if (filters.page) params.append('page', String(filters.page))
      if (filters.pageSize) params.append('pageSize', String(filters.pageSize))

      const response = await fetch(`/api/users?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data: UsersListResponse = await response.json()
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const updateUser = async (userId: string, data: UpdateUserDTO) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      const updatedUser = await response.json()
      
      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? updatedUser : user))
      )

      return updatedUser
    } catch (err) {
      throw err
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      // Refresh users list
      await fetchUsers()
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchUsers()
    }
  }, [fetchUsers, autoFetch])

  return {
    users,
    total,
    loading,
    error,
    filters,
    setFilters,
    fetchUsers,
    updateUser,
    deleteUser,
  }
}