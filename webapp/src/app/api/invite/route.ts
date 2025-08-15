import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { generateInvitationCode } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    // Sprawdź czy użytkownik ma uprawnienia do wysyłania zaproszeń
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    const { email, expiresInDays = 7 } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Nieprawidłowy adres email' }, { status: 400 })
    }

    // Sprawdź czy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Użytkownik z tym emailem już istnieje' }, { status: 400 })
    }

    // Sprawdź czy istnieje aktywne zaproszenie
    const existingInvitation = await prisma.invitationCode.findFirst({
      where: {
        email,
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    })

    if (existingInvitation) {
      return NextResponse.json({ 
        error: 'Aktywne zaproszenie dla tego emaila już istnieje',
        existingCode: existingInvitation.code 
      }, { status: 400 })
    }

    // Generuj kod zaproszenia
    const code = generateInvitationCode()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    const invitation = await prisma.invitationCode.create({
      data: {
        code,
        email,
        expiresAt,
        invitedBy: user.id
      }
    })

    return NextResponse.json({
      success: true,
      invitation: {
        code: invitation.code,
        email: invitation.email,
        expiresAt: invitation.expiresAt
      }
    })

  } catch (error) {
    console.error('Błąd tworzenia zaproszenia:', error)
    return NextResponse.json({ error: 'Wewnętrzny błąd serwera' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    // Pobierz wszystkie zaproszenia wysłane przez użytkownika
    const invitations = await prisma.invitationCode.findMany({
      where: { invitedBy: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ invitations })

  } catch (error) {
    console.error('Błąd pobierania zaproszeń:', error)
    return NextResponse.json({ error: 'Wewnętrzny błąd serwera' }, { status: 500 })
  }
}