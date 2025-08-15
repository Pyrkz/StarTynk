import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import type { VehicleStatistics } from '@/types/fleet'

// GET /api/vehicles/statistics - Get fleet statistics
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    // Get vehicle counts by status
    const [total, active, inMaintenance, retired] = await Promise.all([
      prisma.vehicle.count({ where: { isActive: true } }),
      prisma.vehicle.count({ where: { isActive: true, status: 'ACTIVE' } }),
      prisma.vehicle.count({ where: { isActive: true, status: 'MAINTENANCE' } }),
      prisma.vehicle.count({ where: { isActive: true, status: 'RETIRED' } }),
    ])

    // Get vehicles with upcoming service needs
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const [dueForService, dueForInspection, dueForInsurance] = await Promise.all([
      // Due for service (based on reminders)
      prisma.vehicleReminder.count({
        where: {
          isActive: true,
          isCompleted: false,
          type: 'SERVICE',
          dueDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
          vehicle: {
            isActive: true,
            status: 'ACTIVE',
          },
        },
      }),
      // Due for inspection
      prisma.vehicle.count({
        where: {
          isActive: true,
          status: 'ACTIVE',
          inspectionExpiry: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),
      // Due for insurance
      prisma.vehicle.count({
        where: {
          isActive: true,
          status: 'ACTIVE',
          insuranceExpiry: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),
    ])

    const statistics: VehicleStatistics = {
      total,
      active,
      inMaintenance,
      retired,
      dueForService,
      dueForInspection,
      dueForInsurance,
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching vehicle statistics:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania statystyk' },
      { status: 500 }
    )
  }
}