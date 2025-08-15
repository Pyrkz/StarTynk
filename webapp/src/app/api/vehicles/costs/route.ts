import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import type { VehicleCostSummary } from '@/types/fleet'

// GET /api/vehicles/costs - Get vehicle cost summaries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'month' // month, quarter, year
    const vehicleId = searchParams.get('vehicleId') || ''

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        startDate.setMonth(startDate.getMonth() - 1)
    }

    // Build where clause for vehicles
    const vehicleWhere = {
      isActive: true,
      ...(vehicleId && { id: vehicleId }),
    }

    // Get vehicles with maintenance costs
    const vehicles = await prisma.vehicle.findMany({
      where: vehicleWhere,
      include: {
        maintenances: {
          where: {
            isActive: true,
            serviceDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            type: true,
            cost: true,
          },
        },
      },
    })

    // Calculate cost summaries
    const costSummaries: VehicleCostSummary[] = vehicles.map((vehicle: any) => {
      const maintenanceCosts = vehicle.maintenances.reduce((acc: {
        total: number
        maintenance: number
        insurance: number
        fuel: number
      }, maintenance: any) => {
        const cost = maintenance.cost.toNumber()
        
        switch (maintenance.type) {
          case 'INSURANCE':
            acc.insurance += cost
            break
          case 'REPAIR':
          case 'SERVICE':
          case 'INSPECTION':
            acc.maintenance += cost
            break
        }
        
        acc.total += cost
        return acc
      }, {
        total: 0,
        maintenance: 0,
        insurance: 0,
        fuel: 0, // Fuel costs would come from a separate fuel tracking module
      })

      // Calculate monthly average
      const monthsDiff = Math.max(
        1,
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
      const monthlyAverage = maintenanceCosts.total / monthsDiff

      return {
        vehicleId: vehicle.id,
        vehicle: {
          make: vehicle.make,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate,
        },
        totalCost: maintenanceCosts.total,
        fuelCost: maintenanceCosts.fuel,
        maintenanceCost: maintenanceCosts.maintenance,
        insuranceCost: maintenanceCosts.insurance,
        monthlyAverage,
      }
    })

    // Sort by total cost (highest first)
    costSummaries.sort((a, b) => b.totalCost - a.totalCost)

    return NextResponse.json({
      period: {
        start: startDate,
        end: endDate,
        type: period,
      },
      vehicles: costSummaries,
      summary: {
        totalCost: costSummaries.reduce((sum, v) => sum + v.totalCost, 0),
        totalFuelCost: costSummaries.reduce((sum, v) => sum + v.fuelCost, 0),
        totalMaintenanceCost: costSummaries.reduce((sum, v) => sum + v.maintenanceCost, 0),
        totalInsuranceCost: costSummaries.reduce((sum, v) => sum + v.insuranceCost, 0),
        averageMonthlyCost: costSummaries.reduce((sum, v) => sum + v.monthlyAverage, 0) / Math.max(1, costSummaries.length),
      },
    })
  } catch (error) {
    console.error('Error fetching vehicle costs:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania kosztów' },
      { status: 500 }
    )
  }
}