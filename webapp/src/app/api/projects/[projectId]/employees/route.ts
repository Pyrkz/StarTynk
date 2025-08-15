import { NextRequest, NextResponse } from 'next/server'
import { mockEmployees } from './mock-data'

// GET /api/projects/[projectId]/employees - Return mock employees data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    
    // Return mock employees for demo
    return NextResponse.json(mockEmployees)
    
  } catch (error) {
    console.error('Error fetching project employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project employees' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[projectId]/employees - Mock assign employee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const body = await request.json()
    
    // Mock successful assignment
    const assignment = {
      id: String(Date.now()),
      projectId,
      userId: body.userId,
      role: body.role || 'Pracownik',
      startDate: new Date(),
      isActive: true,
      user: {
        id: body.userId,
        name: 'New Employee',
        email: 'new@example.com'
      }
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error assigning employee to project:', error)
    return NextResponse.json(
      { error: 'Failed to assign employee to project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[projectId]/employees/[userId] - Remove employee from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // const session = await getServerSession(authOptions) // Temporarily disabled for client demo
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { projectId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Mock successful removal
    const removedAssignment = {
      projectId,
      userId,
      isActive: false,
      endDate: new Date(),
      message: 'Employee removed from project'
    }

    return NextResponse.json(removedAssignment)
  } catch (error) {
    console.error('Error removing employee from project:', error)
    return NextResponse.json(
      { error: 'Failed to remove employee from project' },
      { status: 500 }
    )
  }
}