import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@repo/database'
import { 
  calculateServiceStatus, 
  calculateDateBasedStatus,
  type EnhancedVehicleStatistics
} from '@/types/fleet-enhanced'

// GET /api/vehicles/statistics/enhanced - Get enhanced fleet statistics
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    // Get all active vehicles with their data
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      include: {
        assignments: {
          where: { isActive: true }
        },
        projectAssignments: {
          where: { isActive: true }
        },
        maintenances: {
          where: {
            serviceDate: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
          }
        }
      }
    })

    const currentDate = new Date()
    let criticalAlerts = 0
    let urgentAlerts = 0
    let warningAlerts = 0

    // Calculate alert counts
    vehicles.forEach((vehicle: any) => {
      // Check mileage-based services
      const engineOilStatus = calculateServiceStatus(
        vehicle.currentMileage,
        vehicle.lastOilChangeMileage,
        vehicle.engineOilInterval
      )
      if (engineOilStatus.urgency === 'critical') criticalAlerts++
      else if (engineOilStatus.urgency === 'urgent') urgentAlerts++
      else if (engineOilStatus.urgency === 'warning') warningAlerts++

      const transOilStatus = calculateServiceStatus(
        vehicle.currentMileage,
        vehicle.lastTransOilChangeMileage,
        vehicle.transOilInterval
      )
      if (transOilStatus.urgency === 'critical') criticalAlerts++
      else if (transOilStatus.urgency === 'urgent') urgentAlerts++
      else if (transOilStatus.urgency === 'warning') warningAlerts++

      // Check date-based services
      if (vehicle.inspectionExpiry) {
        const inspectionStatus = calculateDateBasedStatus(vehicle.inspectionExpiry, currentDate)
        if (inspectionStatus.urgency === 'critical') criticalAlerts++
        else if (inspectionStatus.urgency === 'urgent') urgentAlerts++
        else if (inspectionStatus.urgency === 'warning') warningAlerts++
      }

      if (vehicle.insuranceExpiry) {
        const insuranceStatus = calculateDateBasedStatus(vehicle.insuranceExpiry, currentDate)
        if (insuranceStatus.urgency === 'critical') criticalAlerts++
        else if (insuranceStatus.urgency === 'urgent') urgentAlerts++
        else if (insuranceStatus.urgency === 'warning') warningAlerts++
      }
    })

    // Calculate monthly costs
    const currentMonthCosts = vehicles.reduce((sum: number, vehicle: any) => {
      const vehicleCost = vehicle.maintenances.reduce((vSum: number, m: any) => 
        vSum + parseFloat(m.cost.toString()), 0
      )
      return sum + vehicleCost
    }, 0)

    // Get last month's costs for trend calculation
    const lastMonthStart = new Date()
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 2)
    lastMonthStart.setDate(1)
    const lastMonthEnd = new Date()
    lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1)
    lastMonthEnd.setDate(0)

    const lastMonthMaintenances = await prisma.vehicleMaintenance.findMany({
      where: {
        isActive: true,
        serviceDate: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    })

    const lastMonthCosts = lastMonthMaintenances.reduce((sum: number, m: any) => 
      sum + parseFloat(m.cost.toString()), 0
    )

    const trend = lastMonthCosts > 0 
      ? ((currentMonthCosts - lastMonthCosts) / lastMonthCosts) * 100 
      : 0

    const statistics: EnhancedVehicleStatistics = {
      total: vehicles.length,
      active: vehicles.filter((v: any) => v.status === 'ACTIVE').length,
      inService: vehicles.filter((v: any) => v.status === 'MAINTENANCE').length,
      retired: vehicles.filter((v: any) => v.status === 'RETIRED').length,
      available: vehicles.filter((v: any) => 
        v.status === 'ACTIVE' && 
        v.assignments.length === 0 && 
        v.projectAssignments.length === 0
      ).length,
      assignedToEmployees: vehicles.filter((v: any) => v.assignments.length > 0).length,
      assignedToProjects: vehicles.filter((v: any) => v.projectAssignments.length > 0).length,
      alerts: {
        critical: criticalAlerts,
        urgent: urgentAlerts,
        warning: warningAlerts,
        total: criticalAlerts + urgentAlerts + warningAlerts
      },
      monthlyMetrics: {
        costs: currentMonthCosts,
        servicesCompleted: vehicles.reduce((sum: number, v: any) => sum + v.maintenances.length, 0),
        averageCostPerVehicle: vehicles.length > 0 ? currentMonthCosts / vehicles.length : 0,
        trend: parseFloat(trend.toFixed(1))
      }
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching enhanced statistics:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania statystyk' },
      { status: 500 }
    )
  }
}