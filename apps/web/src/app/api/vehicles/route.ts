import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { vehicleSchema } from '@/types/fleet'
import { Prisma } from '@repo/database'

// GET /api/vehicles - Get paginated vehicles list
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    // Build where clause
    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { make: { contains: search } },
          { model: { contains: search } },
          { licensePlate: { contains: search } },
          { vin: { contains: search } },
        ],
      }),
      ...(status && { status: status as 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' }),
    }

    // Get total count
    const total = await prisma.vehicle.count({ where })

    // Get vehicles with current assignment
    const vehicles = await prisma.vehicle.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            maintenances: true,
            reminders: {
              where: {
                isCompleted: false,
                dueDate: {
                  gte: new Date(),
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania pojazdów' },
      { status: 500 }
    )
  }
}

// POST /api/vehicles - Create new vehicle
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = vehicleSchema.parse(body)

    // Check if license plate already exists
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        licensePlate: validatedData.licensePlate,
        isActive: true,
      },
    })

    if (existingVehicle) {
      return NextResponse.json(
        { error: 'Pojazd z tym numerem rejestracyjnym już istnieje' },
        { status: 400 }
      )
    }

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        make: validatedData.make,
        model: validatedData.model,
        year: validatedData.year,
        licensePlate: validatedData.licensePlate,
        vin: validatedData.vin,
        insuranceExpiry: validatedData.insuranceExpiry,
        inspectionExpiry: validatedData.inspectionExpiry,
        purchaseDate: validatedData.purchaseDate,
        purchasePrice: validatedData.purchasePrice,
        status: validatedData.status,
      },
    })

    // Create initial reminders if dates are provided
    const reminders = []
    
    if (validatedData.insuranceExpiry) {
      reminders.push({
        vehicleId: vehicle.id,
        type: 'INSURANCE' as const,
        dueDate: validatedData.insuranceExpiry,
        description: 'Odnowienie ubezpieczenia',
        daysBefore: 30,
      })
    }

    if (validatedData.inspectionExpiry) {
      reminders.push({
        vehicleId: vehicle.id,
        type: 'INSPECTION' as const,
        dueDate: validatedData.inspectionExpiry,
        description: 'Przegląd techniczny',
        daysBefore: 30,
      })
    }

    if (reminders.length > 0) {
      await prisma.vehicleReminder.createMany({
        data: reminders,
      })
    }

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error('Error creating vehicle:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia pojazdu' },
      { status: 500 }
    )
  }
}