import { NextRequest, NextResponse } from 'next/server'
import { mockProjects } from './mock-data'

// GET /api/projects - Return mock projects data for demo
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get search parameter for filtering
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    // Filter mock projects
    let filteredProjects = [...mockProjects]
    
    if (search) {
      filteredProjects = filteredProjects.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status)
    }

    // Pagination
    const total = filteredProjects.length
    const paginatedProjects = filteredProjects.slice(skip, skip + limit)

    return NextResponse.json({
      projects: paginatedProjects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects - Mock create project for demo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Create a new mock project
    const newProject = {
      id: String(Date.now()),
      name: body.name || 'New Project',
      address: body.address || 'New Address',
      developerId: body.developerId || 'dev1',
      developer: {
        id: body.developerId || 'dev1',
        name: 'Demo Developer'
      },
      coordinatorId: body.coordinatorId || 'coord1',
      coordinator: {
        id: body.coordinatorId || 'coord1',
        name: 'Demo Coordinator'
      },
      status: body.status || 'PLANNING',
      startDate: new Date(body.startDate || Date.now()),
      endDate: new Date(body.endDate || Date.now() + 365 * 24 * 60 * 60 * 1000),
      apartmentCount: body.apartmentCount || 0,
      description: body.description || '',
      baseRate: body.baseRate || 85,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 'demo-user',
      deletedAt: null,
      _count: {
        apartments: 0,
        tasks: 0
      }
    }

    return NextResponse.json({ project: newProject }, { status: 201 })

  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}