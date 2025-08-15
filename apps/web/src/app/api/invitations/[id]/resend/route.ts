import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { sendInvitationEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/invitations/[id]/resend - Resend invitation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params to get the id
    const { id } = await params

    // Get invitation
    const invitation = await prisma.invitationCode.findUnique({
      where: { id },
      include: {
        inviter: true,
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check permissions - only the inviter or admin can resend
    if (session.user.role !== 'ADMIN' && session.user.id !== invitation.invitedBy) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if invitation was already used
    if (invitation.usedAt) {
      return NextResponse.json(
        { error: 'Invitation has already been used' },
        { status: 400 }
      )
    }

    // Check if invitation expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Update invitation resend count and last sent date
    const updatedInvitation = await prisma.invitationCode.update({
      where: { id },
      data: {
        resendCount: invitation.resendCount + 1,
        lastSentAt: new Date(),
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'invitation_resent',
        details: JSON.stringify({
          invitationId: invitation.id,
          email: invitation.email,
          resendCount: updatedInvitation.resendCount,
        }),
      },
    })

    // Send invitation email
    await sendInvitationEmail(
      invitation.email, 
      invitation.code, 
      invitation.inviter.name || undefined,
      invitation.message || undefined
    )

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
      invitation: updatedInvitation,
    })
  } catch (error) {
    console.error('Error resending invitation:', error)
    return NextResponse.json(
      { error: 'Failed to resend invitation' },
      { status: 500 }
    )
  }
}