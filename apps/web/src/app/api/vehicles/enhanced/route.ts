import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@repo/database'
import { 
  calculateServiceStatus, 
  calculateDateBasedStatus,
  type FleetOverviewCard,
  type ServiceAlert,
  type ServiceAlertType,
  getServiceAlertMessage
} from '@/types/fleet-enhanced'

// GET /api/vehicles/enhanced - Get enhanced vehicles list with service alerts
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
    const serviceStatus = searchParams.get('serviceStatus') || ''
    const assignmentType = searchParams.get('assignmentType') || ''

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
      ...(status && { status: status as any }),
    }

    // Get vehicles with all relations
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
                position: true,
                department: true,
              },
            },
          },
        },
        projectAssignments: {
          where: { isActive: true },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                address: true,
                status: true,
              },
            },
          },
        },
        maintenances: {
          orderBy: { serviceDate: 'desc' },
          take: 5,
        },
        reminders: {
          where: { 
            isCompleted: false,
            isActive: true,
          },
        },
      },
    })

    // Transform vehicles into FleetOverviewCards with service calculations
    const enhancedVehicles: FleetOverviewCard[] = vehicles.map((vehicle: any) => {
      const currentDate = new Date()
      const serviceAlerts: ServiceAlert[] = []

      // Calculate engine oil service
      const engineOilStatus = calculateServiceStatus(
        vehicle.currentMileage,
        vehicle.lastOilChangeMileage,
        vehicle.engineOilInterval
      )
      engineOilStatus.type = 'ENGINE_OIL'

      if (engineOilStatus.status !== 'ok') {
        serviceAlerts.push({
          id: `${vehicle.id}-engine-oil`,
          vehicleId: vehicle.id,
          type: 'ENGINE_OIL',
          urgency: engineOilStatus.urgency,
          status: engineOilStatus.status,
          message: getServiceAlertMessage('ENGINE_OIL', engineOilStatus.remainingMileage, true),
          remainingValue: engineOilStatus.remainingMileage,
          isDistanceBased: true,
          percentageUsed: engineOilStatus.percentageUsed
        })
      }

      // Calculate transmission oil service
      const transOilStatus = calculateServiceStatus(
        vehicle.currentMileage,
        vehicle.lastTransOilChangeMileage,
        vehicle.transOilInterval
      )
      transOilStatus.type = 'TRANSMISSION_OIL'

      if (transOilStatus.status !== 'ok') {
        serviceAlerts.push({
          id: `${vehicle.id}-trans-oil`,
          vehicleId: vehicle.id,
          type: 'TRANSMISSION_OIL',
          urgency: transOilStatus.urgency,
          status: transOilStatus.status,
          message: getServiceAlertMessage('TRANSMISSION_OIL', transOilStatus.remainingMileage, true),
          remainingValue: transOilStatus.remainingMileage,
          isDistanceBased: true,
          percentageUsed: transOilStatus.percentageUsed
        })
      }

      // Calculate tire rotation service
      let tireRotationStatus
      if (vehicle.lastTireRotationMileage !== null) {
        tireRotationStatus = calculateServiceStatus(
          vehicle.currentMileage,
          vehicle.lastTireRotationMileage,
          vehicle.tireRotationInterval
        )
        tireRotationStatus.type = 'TIRE_ROTATION'

        if (tireRotationStatus.status !== 'ok') {
          serviceAlerts.push({
            id: `${vehicle.id}-tire-rotation`,
            vehicleId: vehicle.id,
            type: 'TIRE_ROTATION',
            urgency: tireRotationStatus.urgency,
            status: tireRotationStatus.status,
            message: getServiceAlertMessage('TIRE_ROTATION', tireRotationStatus.remainingMileage, true),
            remainingValue: tireRotationStatus.remainingMileage,
            isDistanceBased: true,
            percentageUsed: tireRotationStatus.percentageUsed
          })
        }
      }

      // Calculate general service
      let generalServiceStatus
      if (vehicle.lastGeneralServiceMileage !== null) {
        generalServiceStatus = calculateServiceStatus(
          vehicle.currentMileage,
          vehicle.lastGeneralServiceMileage,
          vehicle.generalServiceInterval
        )
        generalServiceStatus.type = 'GENERAL_SERVICE'

        if (generalServiceStatus.status !== 'ok') {
          serviceAlerts.push({
            id: `${vehicle.id}-general-service`,
            vehicleId: vehicle.id,
            type: 'GENERAL_SERVICE',
            urgency: generalServiceStatus.urgency,
            status: generalServiceStatus.status,
            message: getServiceAlertMessage('GENERAL_SERVICE', generalServiceStatus.remainingMileage, true),
            remainingValue: generalServiceStatus.remainingMileage,
            isDistanceBased: true,
            percentageUsed: generalServiceStatus.percentageUsed
          })
        }
      }

      // Check inspection expiry
      let inspectionStatus
      if (vehicle.inspectionExpiry) {
        const inspectionCheck = calculateDateBasedStatus(vehicle.inspectionExpiry, currentDate)
        inspectionStatus = {
          dueDate: vehicle.inspectionExpiry,
          daysRemaining: inspectionCheck.daysRemaining,
          status: inspectionCheck.status
        }

        if (inspectionCheck.status !== 'ok') {
          serviceAlerts.push({
            id: `${vehicle.id}-inspection`,
            vehicleId: vehicle.id,
            type: 'INSPECTION',
            urgency: inspectionCheck.urgency,
            status: inspectionCheck.status,
            message: getServiceAlertMessage('INSPECTION', inspectionCheck.daysRemaining, false),
            remainingValue: inspectionCheck.daysRemaining,
            isDistanceBased: false,
            dueDate: vehicle.inspectionExpiry,
            percentageUsed: 0
          })
        }
      }

      // Check insurance expiry
      let insuranceStatus
      if (vehicle.insuranceExpiry) {
        const insuranceCheck = calculateDateBasedStatus(vehicle.insuranceExpiry, currentDate)
        insuranceStatus = {
          dueDate: vehicle.insuranceExpiry,
          daysRemaining: insuranceCheck.daysRemaining,
          status: insuranceCheck.status
        }

        if (insuranceCheck.status !== 'ok') {
          serviceAlerts.push({
            id: `${vehicle.id}-insurance`,
            vehicleId: vehicle.id,
            type: 'INSURANCE',
            urgency: insuranceCheck.urgency,
            status: insuranceCheck.status,
            message: getServiceAlertMessage('INSURANCE', insuranceCheck.daysRemaining, false),
            remainingValue: insuranceCheck.daysRemaining,
            isDistanceBased: false,
            dueDate: vehicle.insuranceExpiry,
            percentageUsed: 0
          })
        }
      }

      // Determine current assignment
      let currentAssignment
      if (vehicle.assignments.length > 0) {
        const assignment = vehicle.assignments[0]
        currentAssignment = {
          type: 'employee' as const,
          assignedTo: assignment.user.name || assignment.user.email,
          assignedToId: assignment.user.id,
          location: assignment.user.department
        }
      } else if (vehicle.projectAssignments.length > 0) {
        const projectAssignment = vehicle.projectAssignments[0]
        currentAssignment = {
          type: 'project' as const,
          assignedTo: projectAssignment.project.name,
          assignedToId: projectAssignment.project.id,
          location: projectAssignment.project.address
        }
      }

      // Calculate monthly service cost
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      
      const monthlyServiceCost = vehicle.maintenances
        .filter((m: any) => new Date(m.serviceDate) >= oneMonthAgo)
        .reduce((sum: number, m: any) => sum + parseFloat(m.cost.toString()), 0)

      // Build the card
      const card: FleetOverviewCard = {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        type: vehicle.type,
        licensePlate: vehicle.licensePlate,
        status: vehicle.status,
        photoUrl: vehicle.photoUrl || undefined,
        currentAssignment,
        serviceAlerts,
        upcomingServices: {
          engineOil: engineOilStatus,
          transmissionOil: transOilStatus,
          tireRotation: tireRotationStatus,
          generalService: generalServiceStatus,
          inspection: inspectionStatus,
          insurance: insuranceStatus
        },
        quickStats: {
          totalAlerts: serviceAlerts.length,
          criticalAlerts: serviceAlerts.filter(a => a.urgency === 'critical').length,
          monthlyServiceCost
        }
      }

      return card
    })

    // Apply service status filter if specified
    let filteredVehicles = enhancedVehicles
    if (serviceStatus) {
      filteredVehicles = enhancedVehicles.filter(vehicle => {
        const hasOverdue = vehicle.serviceAlerts.some(a => a.status === 'overdue')
        const hasDueSoon = vehicle.serviceAlerts.some(a => a.status === 'due_soon')
        
        switch (serviceStatus) {
          case 'up_to_date':
            return vehicle.serviceAlerts.length === 0
          case 'due_soon':
            return hasDueSoon && !hasOverdue
          case 'overdue':
            return hasOverdue
          default:
            return true
        }
      })
    }

    // Apply assignment type filter if specified
    if (assignmentType) {
      filteredVehicles = filteredVehicles.filter(vehicle => {
        switch (assignmentType) {
          case 'unassigned':
            return !vehicle.currentAssignment
          case 'employee':
            return vehicle.currentAssignment?.type === 'employee'
          case 'project':
            return vehicle.currentAssignment?.type === 'project'
          default:
            return true
        }
      })
    }

    // Get total count
    const total = await prisma.vehicle.count({ where })

    return NextResponse.json({
      vehicles: filteredVehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching enhanced vehicles:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania pojazdów' },
      { status: 500 }
    )
  }
}