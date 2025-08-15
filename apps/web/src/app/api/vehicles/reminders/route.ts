import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@repo/database'
import { Prisma } from '@repo/database'
import type { UpcomingReminder } from '@/types/fleet'
import { getReminderUrgency } from '@/types/fleet'

// GET /api/vehicles/reminders - Get upcoming reminders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const urgency = searchParams.get('urgency') || ''

    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    // Get reminders from VehicleReminder table
    const vehicleReminders = await prisma.vehicleReminder.findMany({
      where: {
        isActive: true,
        isCompleted: false,
        dueDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
        vehicle: {
          isActive: true,
          status: 'ACTIVE',
        },
      },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            licensePlate: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: limit,
    })

    // Get insurance and inspection reminders from Vehicle table
    const vehicles = await prisma.vehicle.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        OR: [
          {
            insuranceExpiry: {
              gte: now,
              lte: thirtyDaysFromNow,
            },
          },
          {
            inspectionExpiry: {
              gte: now,
              lte: thirtyDaysFromNow,
            },
          },
        ],
      },
      select: {
        id: true,
        make: true,
        model: true,
        licensePlate: true,
        insuranceExpiry: true,
        inspectionExpiry: true,
      },
    })

    // Combine all reminders
    const allReminders: UpcomingReminder[] = []

    // Add reminders from VehicleReminder table
    vehicleReminders.forEach((reminder: typeof vehicleReminders[0]) => {
      const daysUntilDue = Math.ceil(
        (reminder.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      allReminders.push({
        id: reminder.id,
        vehicleId: reminder.vehicleId,
        vehicle: reminder.vehicle,
        type: reminder.type,
        dueDate: reminder.dueDate.toISOString(),
        daysUntilDue,
        description: reminder.description,
        urgency: getReminderUrgency(daysUntilDue),
      })
    })

    // Add insurance and inspection reminders from Vehicle table
    vehicles.forEach((vehicle: {
      id: string
      make: string
      model: string
      licensePlate: string
      insuranceExpiry: Date | null
      inspectionExpiry: Date | null
    }) => {
      if (vehicle.insuranceExpiry) {
        const daysUntilDue = Math.ceil(
          (vehicle.insuranceExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        allReminders.push({
          id: `insurance-${vehicle.id}`,
          vehicleId: vehicle.id,
          vehicle: {
            make: vehicle.make,
            model: vehicle.model,
            licensePlate: vehicle.licensePlate,
          },
          type: 'INSURANCE',
          dueDate: vehicle.insuranceExpiry.toISOString(),
          daysUntilDue,
          description: 'Wygaśnięcie ubezpieczenia',
          urgency: getReminderUrgency(daysUntilDue),
        })
      }

      if (vehicle.inspectionExpiry) {
        const daysUntilDue = Math.ceil(
          (vehicle.inspectionExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        allReminders.push({
          id: `inspection-${vehicle.id}`,
          vehicleId: vehicle.id,
          vehicle: {
            make: vehicle.make,
            model: vehicle.model,
            licensePlate: vehicle.licensePlate,
          },
          type: 'INSPECTION',
          dueDate: vehicle.inspectionExpiry.toISOString(),
          daysUntilDue,
          description: 'Wygaśnięcie przeglądu technicznego',
          urgency: getReminderUrgency(daysUntilDue),
        })
      }
    })

    // Sort by due date
    allReminders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    // Filter by urgency if specified
    let filteredReminders = allReminders
    if (urgency) {
      filteredReminders = allReminders.filter((r) => r.urgency === urgency)
    }

    // Limit results
    const finalReminders = filteredReminders.slice(0, limit)

    return NextResponse.json(finalReminders)
  } catch (error) {
    console.error('Error fetching vehicle reminders:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania przypomnień' },
      { status: 500 }
    )
  }
}