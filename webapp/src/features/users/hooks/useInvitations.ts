'use client'

import { useState, useCallback } from 'react'
import { CreateInvitationDTO, InvitationWithInviter } from '@/features/users/types'

export function useInvitations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createInvitation = useCallback(async (data: CreateInvitationDTO) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invitation')
      }

      const result = await response.json()
      return result.invitation as InvitationWithInviter
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const resendInvitation = useCallback(async (invitationId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resend invitation')
      }

      const result = await response.json()
      return result.invitation as InvitationWithInviter
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInvitations = useCallback(async (status: 'all' | 'pending' | 'used' | 'expired' = 'all') => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ status })
      const response = await fetch(`/api/invitations?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch invitations')
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    createInvitation,
    resendInvitation,
    fetchInvitations,
  }
}