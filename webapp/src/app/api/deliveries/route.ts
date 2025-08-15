import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/features/auth/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user to check permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('limit') || '20')
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const deliveryType = searchParams.get('deliveryType')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {
      isActive: true
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (deliveryType && deliveryType !== 'ALL') {
      where.deliveryType = deliveryType
    }

    if (search) {
      where.OR = [
        { supplierName: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (startDate || endDate) {
      where.deliveryDate = {}
      if (startDate) {
        where.deliveryDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.deliveryDate.lte = new Date(endDate)
      }
    }

    // Get total count
    const total = await prisma.delivery.count({ where })

    // Get deliveries with relations
    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        receivedBy: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                price: true,
                unit: true
              }
            }
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        deliveryDate: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // Transform deliveries to match the expected format
    const transformedDeliveries = deliveries.map(delivery => ({
      id: delivery.id,
      supplierName: delivery.supplierName,
      deliveryDate: delivery.deliveryDate,
      status: delivery.status,
      deliveryType: delivery.deliveryType,
      totalWeight: delivery.totalWeight,
      totalValue: null, // Not in current schema
      palletCount: null, // Not in current schema
      packageCount: null, // Not in current schema
      project: delivery.project,
      receivedBy: delivery.receivedBy,
      items: delivery.items,
      _count: {
        items: delivery._count.items,
        photos: 0 // No photos relation in current schema
      }
    }))

    const response = {
      deliveries: transformedDeliveries,
      pagination: {
        page,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching deliveries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Implement delivery creation logic
    return NextResponse.json(
      { error: 'Not implemented yet' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error creating delivery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}