import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@repo/database'

// GET /api/developers - List all active developers
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    const developers = await prisma.developer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        email: true,
        phone: true,
        _count: {
          select: {
            projects: { where: { isActive: true } }
          }
        }
      }
    })

    return NextResponse.json({ developers })

  } catch (error) {
    console.error('Błąd pobierania deweloperów:', error)
    return NextResponse.json({ error: 'Wewnętrzny błąd serwera' }, { status: 500 })
  }
}

// POST /api/developers - Create new developer (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    // Get user to check permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Brak uprawnień - tylko administrator może dodawać deweloperów' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, contact, email, phone } = body

    if (!name) {
      return NextResponse.json({ error: 'Nazwa dewelopera jest wymagana' }, { status: 400 })
    }

    // Check if developer with same name already exists
    const existingDeveloper = await prisma.developer.findFirst({
      where: { 
        name,
        isActive: true 
      }
    })

    if (existingDeveloper) {
      return NextResponse.json({ error: 'Deweloper o takiej nazwie już istnieje' }, { status: 400 })
    }

    const developer = await prisma.developer.create({
      data: {
        name,
        address,
        contact,
        email,
        phone,
      }
    })

    return NextResponse.json({ developer }, { status: 201 })

  } catch (error) {
    console.error('Błąd tworzenia dewelopera:', error)
    return NextResponse.json({ error: 'Wewnętrzny błąd serwera' }, { status: 500 })
  }
}