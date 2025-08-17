'use client'

import { useState, useCallback } from 'react'
import { useUsers, useInvitations } from '@/features/users'
import { UserWithRelations, CreateInvitationDTO } from '@/features/users/types'
import { 
  UsersPageHeader,
  UsersPageContent,
  UsersPagination,
  InviteUserModal,
  SuccessNotification 
} from '@/features/users/components/UsersPage'
import { UserDetailsModal } from '@/features/users/components/UserDetailsModal'

export default function UsersPage() {
  const { users, total, loading, filters, setFilters, deleteUser, fetchUsers } = useUsers({
    initialFilters: {
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isActive: 'ALL',
    },
  })

  const { createInvitation, loading: inviteLoading, error: inviteError } = useInvitations()
  
  const [selectedUser, setSelectedUser] = useState<UserWithRelations | null>(null)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [updateLoading, setUpdateLoading] = useState(false)

  const handleEdit = useCallback((user: UserWithRelations) => {
    setSelectedUser(user)
  }, [])

  const handleUpdate = useCallback(async (userId: string, data: any) => {
    setUpdateLoading(true)
    try {
      const response = await fetch(`/api/employees/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      await fetchUsers()
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Wystąpił błąd podczas aktualizacji użytkownika')
    } finally {
      setUpdateLoading(false)
    }
  }, [fetchUsers])

  const handleDelete = useCallback(async (user: UserWithRelations) => {
    try {
      await deleteUser((user as any).id)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }, [deleteUser])

  const handleInviteUser = useCallback(async (data: CreateInvitationDTO) => {
    try {
      const invitation = await createInvitation(data)
      setInviteSuccess(`Zaproszenie zostało wysłane. Kod: ${(invitation as any).code}`)
      setIsInviteModalOpen(false)
    } catch (error) {
      console.error('Error creating invitation:', error)
    }
  }, [createInvitation])

  const handleCloseInviteModal = useCallback(() => {
    setIsInviteModalOpen(false)
    setInviteSuccess(null)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }, [setFilters])

  const totalPages = Math.ceil(total / (filters.pageSize || 20))

  return (
    <>
      <UsersPageHeader onInviteClick={() => setIsInviteModalOpen(true)} />

      <UsersPageContent
        users={users}
        loading={loading}
        filters={filters}
        onFiltersChange={setFilters}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {totalPages > 1 && (
        <UsersPagination
          currentPage={filters.page || 1}
          totalPages={totalPages}
          total={total}
          pageSize={filters.pageSize || 20}
          loading={loading}
          onPageChange={handlePageChange}
        />
      )}

      {inviteSuccess && (
        <SuccessNotification
          message={inviteSuccess}
          onClose={() => setInviteSuccess(null)}
        />
      )}

      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={handleCloseInviteModal}
        onSubmit={handleInviteUser}
        loading={inviteLoading}
        error={inviteError}
      />

      <UserDetailsModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        loading={updateLoading}
      />
    </>
  )
}