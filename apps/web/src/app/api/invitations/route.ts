import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@repo/database'
import { generateInvitationCode } from '@/lib/utils'
import { sendInvitationEmail } from '@/lib/email'
import { CreateInvitationDTO, InvitationsListResponse, InvitationWithInviter } from '@/features/users/types'

// GET /api/invitations - List invitations with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all' // all, pending, used, expired
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build where clause
    const where: {
      usedAt?: null | { not: null }
      expiresAt?: { gt: Date } | { lte: Date }
      invitedBy?: string
    } = {}

    if (status === 'pending') {
      where.usedAt = null
      where.expiresAt = { gt: new Date() }
    } else if (status === 'used') {
      where.usedAt = { not: null }
    } else if (status === 'expired') {
      where.usedAt = null
      where.expiresAt = { lte: new Date() }
    }

    // Only admins can see all invitations
    if (session.user.role !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      })
      if (user) {
        where.invitedBy = user.id
      }
    }

    // Count total records
    const total = await prisma.invitationCode.count({ where })

    // Fetch invitations with pagination
    const invitations = await prisma.invitationCode.findMany({
      where,
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const response: InvitationsListResponse = {
      invitations: invitations as InvitationWithInviter[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

// POST /api/invitations - Create new invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR' && user.role !== 'COORDINATOR')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body: CreateInvitationDTO = await request.json()
    const { email, role, message } = body
    const expiresInDays = 7

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { 
          error: 'Active invitation for this email already exists',
          existingCode: existingInvitation.code,
        },
        { status: 400 }
      )
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
        invitedBy: user.id,
        role: role || 'USER',
        message,
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
        userId: user.id,
        action: 'invitation_created',
        details: JSON.stringify({
          invitedEmail: email,
          role: role || 'USER',
        }),
      },
    })

    // Send invitation email
    await sendInvitationEmail(email, code, user.name || undefined, message || undefined)

    return NextResponse.json({
      success: true,
      invitation,
    })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}