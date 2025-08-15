import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/coordinators - List all users who can be coordinators
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    const coordinators = await prisma.user.findMany({
      where: { 
        isActive: true,
        role: { in: ['COORDINATOR', 'ADMIN', 'MODERATOR'] }
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            coordinatedProjects: { where: { isActive: true } }
          }
        }
      }
    })

    return NextResponse.json({ coordinators })

  } catch (error) {
    console.error('Błąd pobierania koordynatorów:', error)
    return NextResponse.json({ error: 'Wewnętrzny błąd serwera' }, { status: 500 })
  }
}