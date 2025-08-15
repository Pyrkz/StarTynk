import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { generateInvitationCode } from '@/lib/utils'
import { BulkInvitationDTO, BulkOperationResult } from '@/features/users/types'

// POST /api/invitations/bulk - Create multiple invitations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: BulkInvitationDTO = await request.json()
    const { invitations } = body

    if (!invitations || invitations.length === 0) {
      return NextResponse.json(
        { error: 'No invitations provided' },
        { status: 400 }
      )
    }

    if (invitations.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 invitations at once' },
        { status: 400 }
      )
    }

    const successful: any[] = []
    const failed: { email: string; error: string }[] = []

    for (const invitationData of invitations) {
      try {
        const { email, role, message } = invitationData
        const expiresInDays = 7

        // Validate email
        if (!email || !email.includes('@')) {
          failed.push({
            email,
            error: 'Invalid email address',
          })
          continue
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        })

        if (existingUser) {
          failed.push({
            email,
            error: 'User already exists',
          })
          continue
        }

        // Check for existing active invitation
        const existingInvitation = await prisma.invitationCode.findFirst({
          where: {
            email,
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
        })

        if (existingInvitation) {
          failed.push({
            email,
            error: 'Active invitation already exists',
          })
          continue
        }

        // Generate invitation code
        const code = generateInvitationCode()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expiresInDays)

        // Create invitation
        const invitation = await prisma.invitationCode.create({
          data: {
            code,
            email,
            expiresAt,
            invitedBy: session.user.id,
            role: role || 'USER',
            message,
          },
          include: {
            inviter: true,
          },
        })

        successful.push(invitation)
      } catch {
        failed.push({
          email: invitationData.email,
          error: 'Failed to create invitation',
        })
      }
    }

    // Log bulk operation
    await prisma.userActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'bulk_invitations_created',
        details: JSON.stringify({
          total: invitations.length,
          successCount: successful.length,
          failureCount: failed.length,
        }),
      },
    })

    // TODO: Send invitation emails in batch
    // await sendBulkInvitationEmails(createdInvitations)

    const result: BulkOperationResult = {
      success: successful.length,
      failed: failed.length,
      errors: failed.map(f => ({
        userId: f.email, // Using email as identifier since these are invitations
        error: f.error
      }))
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating bulk invitations:', error)
    return NextResponse.json(
      { error: 'Failed to create invitations' },
      { status: 500 }
    )
  }
}