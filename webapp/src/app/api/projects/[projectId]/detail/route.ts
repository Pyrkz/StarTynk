import { NextRequest, NextResponse } from 'next/server'
import { getProjectDetail } from './mock-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    
    // Get mock project detail
    const projectDetail = getProjectDetail(projectId)
    
    return NextResponse.json(projectDetail)

  } catch (error) {
    console.error('Error fetching project detail:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const body = await request.json()
    
    // Get existing mock project
    const existingProject = getProjectDetail(projectId)
    
    // Return updated project
    const updatedProject = {
      ...existingProject,
      ...body,
      updatedAt: new Date()
    }

    return NextResponse.json(updatedProject)

  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}