import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/features/auth/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    const { id } = await params

    // Decode the URL parameter to handle spaces and special characters
    const decodedId = decodeURIComponent(id)

    // First try to find by ID, then by license plate (slug)
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        OR: [
          { id: decodedId },
          { licensePlate: decodedId.toUpperCase() }
        ],
        isActive: true
      },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                position: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        projectAssignments: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                address: true,
                status: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        maintenances: {
          orderBy: {
            serviceDate: 'desc'
          }
        },
        reminders: {
          where: {
            isActive: true
          },
          orderBy: {
            dueDate: 'asc'
          }
        }
      }
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Calculate extended data
    const extendedVehicle = {
      ...vehicle,
      costAnalysis: await calculateCostAnalysis(vehicle.id),
      performanceMetrics: await calculatePerformanceMetrics(vehicle.id),
      documents: await getVehicleDocuments(vehicle.id),
      photos: await getVehiclePhotos(vehicle.id)
    }

    return NextResponse.json(extendedVehicle)
  } catch (error) {
    console.error('Error fetching vehicle details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function calculateCostAnalysis(vehicleId: string) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const yearStart = new Date(currentYear, 0, 1)
  const monthStart = new Date(currentYear, currentMonth, 1)

  // Get maintenance costs
  const yearMaintenance = await prisma.vehicleMaintenance.aggregate({
    where: {
      vehicleId,
      serviceDate: {
        gte: yearStart
      },
      isActive: true
    },
    _sum: {
      cost: true
    }
  })

  const monthMaintenance = await prisma.vehicleMaintenance.aggregate({
    where: {
      vehicleId,
      serviceDate: {
        gte: monthStart
      },
      isActive: true
    },
    _sum: {
      cost: true
    }
  })

  // Calculate breakdown (this would be more complex with actual fuel/repair tracking)
  const thisYearTotal = Number(yearMaintenance._sum.cost || 0)
  const thisMonthTotal = Number(monthMaintenance._sum.cost || 0)

  return {
    thisYear: thisYearTotal,
    thisMonth: thisMonthTotal,
    breakdown: {
      service: thisYearTotal * 0.6, // 60% of total for service
      fuel: thisYearTotal * 0.3,    // 30% for fuel (would be tracked separately)
      repairs: thisYearTotal * 0.1, // 10% for repairs
      insurance: 0 // Would be calculated separately
    }
  }
}

async function calculatePerformanceMetrics(vehicleId: string) {
  // Get assignment statistics
  const assignments = await prisma.vehicleAssignment.findMany({
    where: {
      vehicleId,
      isActive: false // completed assignments
    },
    include: {
      user: true
    }
  })

  const projectAssignments = await prisma.vehicleProjectAssignment.findMany({
    where: {
      vehicleId,
      isActive: false // completed project assignments
    },
    include: {
      project: true
    }
  })

  // Calculate metrics
  const totalAssignments = assignments.length
  const totalProjectAssignments = projectAssignments.length
  const totalAssignmentDays = assignments.reduce((total: number, assignment: any) => {
    if (assignment.endDate) {
      const days = Math.ceil(
        (new Date(assignment.endDate).getTime() - new Date(assignment.startDate).getTime()) 
        / (1000 * 60 * 60 * 24)
      )
      return total + days
    }
    return total
  }, 0)

  const avgAssignmentDays = totalAssignments > 0 ? totalAssignmentDays / totalAssignments : 0

  // Calculate utilization rate (simplified)
  const daysSinceCreation = Math.ceil(
    (new Date().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  const utilizationRate = daysSinceCreation > 0 ? (totalAssignmentDays / daysSinceCreation) * 100 : 0

  return {
    utilizationRate: Math.min(utilizationRate, 100),
    avgAssignmentDays,
    totalProjects: totalProjectAssignments,
    fuelEfficiency: 8.2, // Would be calculated from actual fuel data
    costPerKm: 0.18 // Would be calculated from total costs and mileage
  }
}

async function getVehicleDocuments(vehicleId: string) {
  // In a real application, this would fetch from a documents table or file storage
  // For now, return mock data
  return [
    {
      id: `${vehicleId}-reg`,
      name: 'Dowód rejestracyjny',
      type: 'PDF',
      url: `/documents/vehicles/${vehicleId}/registration.pdf`,
      uploadedAt: new Date('2024-01-15')
    },
    {
      id: `${vehicleId}-insurance`,
      name: 'Polisa ubezpieczeniowa',
      type: 'PDF',
      url: `/documents/vehicles/${vehicleId}/insurance.pdf`,
      uploadedAt: new Date('2024-08-03')
    }
  ]
}

async function getVehiclePhotos(vehicleId: string) {
  const photos = await prisma.photo.findMany({
    where: {
      entityType: 'VEHICLE',
      entityId: vehicleId,
      isActive: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return photos.map((photo: any) => photo.url)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        assignments: {
          include: {
            user: true
          }
        },
        maintenances: true,
        reminders: true
      }
    })

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    }

    const { id } = await params

    // Soft delete
    await prisma.vehicle.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}