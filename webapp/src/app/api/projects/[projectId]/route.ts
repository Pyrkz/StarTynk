import { NextRequest, NextResponse } from 'next/server'
import { getMockProject } from './mock-data'
import { updateProjectSchema } from '@/features/projekty/utils/validation'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{
    projectId: string
  }>
}

// GET /api/projects/[id] - Get single project
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    // const session = await getServerSession() // Temporarily disabled for client demo
    // 
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    // }

    // Await params to get the projectId
    const { projectId } = await params

    // Get mock project data
    const project = getMockProject(projectId)

    if (!project || project.id === 'default') {
      return NextResponse.json({ error: 'Projekt nie został znaleziony' }, { status: 404 })
    }

    return NextResponse.json({ project })

  } catch (error) {
    console.error('Błąd pobierania projektu:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Wewnętrzny błąd serwera' }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // const session = await getServerSession() // Temporarily disabled for client demo
    // 
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    // }

    // Await params to get the projectId
    const { projectId } = await params

    // Get user to check permissions - disabled for demo
    // const user = await prisma.user.findUnique({
    //   where: { email: session.user.email! }
    // })

    // if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR' && user.role !== 'COORDINATOR')) {
    //   return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    // }
    
    // Mock user for demo
    const user = { id: 'demo-user', name: 'Demo User', email: 'demo@example.com' }

    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    // Get existing mock project
    const existingProject = getMockProject(projectId)

    if (!existingProject || existingProject.id === 'default') {
      return NextResponse.json({ error: 'Projekt nie został znaleziony' }, { status: 404 })
    }

    // Mock update - merge data
    const updatedProject = {
      ...existingProject,
      ...validatedData,
      updatedAt: new Date(),
    }

    return NextResponse.json({ project: updatedProject })

  } catch (error) {
    console.error('Błąd aktualizacji projektu:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Nieprawidłowe dane', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Wewnętrzny błąd serwera' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Soft delete project
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    // const session = await getServerSession() // Temporarily disabled for client demo
    // 
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 })
    // }

    // Await params to get the projectId
    const { projectId } = await params

    // Get user to check permissions - disabled for demo
    // const user = await prisma.user.findUnique({
    //   where: { email: session.user.email! }
    // })

    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Brak uprawnień - tylko administrator może usuwać projekty' }, { status: 403 })
    // }
    
    // Mock user for demo
    const user = { id: 'demo-user', name: 'Demo User', email: 'demo@example.com' }

    // Get mock project
    const existingProject = getMockProject(projectId)

    if (!existingProject || existingProject.id === 'default') {
      return NextResponse.json({ error: 'Projekt nie został znaleziony' }, { status: 404 })
    }

    // Mock delete - just return success
    return NextResponse.json({ success: true, message: 'Projekt został usunięty' })

  } catch (error) {
    console.error('Błąd usuwania projektu:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Wewnętrzny błąd serwera' }, { status: 500 })
  }
}