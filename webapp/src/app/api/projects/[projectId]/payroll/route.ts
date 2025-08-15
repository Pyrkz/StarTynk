import { NextRequest, NextResponse } from 'next/server'
import { getMockPayrollByProject } from './mock-data'
import { z } from 'zod'

// GET /api/projects/[projectId]/payroll - Get payroll records for a project
export async function GET(
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
    const period = searchParams.get('period') // Format: YYYY-MM

    // Build query conditions
    const whereConditions: any = {
      projectId,
      isActive: true
    }

    if (period) {
      whereConditions.period = period
    }

    // Get mock payroll records
    const payrollRecords = getMockPayrollByProject(projectId, period)

    // Transform the data for the frontend
    const transformedRecords = payrollRecords.map((record: any) => {
      return {
        id: record.id,
        employeeId: record.userId,
        employeeName: record.user.name || 'Unknown',
        employeePosition: record.user.position || 'Worker',
        period: record.period,
        hoursWorked: Number(record.hoursWorked),
        hourlyRate: Number(record.hourlyRate),
        baseSalary: Number(record.regularPay),
        bonuses: record.bonuses ? [{
          id: '1',
          type: 'performance',
          amount: record.bonuses,
          description: 'Performance bonus'
        }] : [],
        deductions: record.deductions ? [{
          id: '1',
          type: 'other',
          amount: record.deductions,
          description: 'Deduction'
        }] : [],
        netPay: Number(record.totalNet),
        status: record.status.toLowerCase() as any,
        paymentDate: record.paidAt,
        paymentMethod: 'bank_transfer' as any,
        tasksCompleted: 5,
        apartmentsCompleted: ['A101', 'A102']
      }
    })

    // Calculate summary statistics
    const summary = {
      totalPayroll: transformedRecords.reduce((sum: number, r: any) => sum + r.netPay, 0),
      totalHours: transformedRecords.reduce((sum: number, r: any) => sum + r.hoursWorked, 0),
      averageHourlyRate: transformedRecords.length > 0
        ? transformedRecords.reduce((sum: number, r: any) => sum + r.hourlyRate, 0) / transformedRecords.length
        : 0,
      employeeCount: transformedRecords.length,
      paidCount: transformedRecords.filter((r: any) => r.status === 'paid').length,
      pendingCount: transformedRecords.filter((r: any) => r.status === 'pending').length
    }

    return NextResponse.json({
      records: transformedRecords,
      summary
    })
  } catch (error) {
    console.error('Error fetching project payroll:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project payroll' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[projectId]/payroll - Create payroll record
const createPayrollSchema = z.object({
  userId: z.string(),
  period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
  hoursWorked: z.number().min(0),
  hourlyRate: z.number().min(0),
  bonuses: z.array(z.object({
    type: z.enum(['QUALITY', 'PERFORMANCE', 'PROJECT_COMPLETION', 'ATTENDANCE', 'OTHER']),
    amount: z.number().min(0),
    description: z.string()
  })).optional(),
  deductions: z.array(z.object({
    type: z.enum(['ABSENCE', 'DAMAGE', 'ADVANCE', 'OTHER']),
    amount: z.number().min(0),
    description: z.string()
  })).optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // const session = await getServerSession(authOptions) // Temporarily disabled for client demo
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { projectId } = await params
    const body = await request.json()
    
    const validatedData = createPayrollSchema.parse(body)

    // Calculate amounts
    const baseSalary = validatedData.hoursWorked * validatedData.hourlyRate
    const totalBonuses = validatedData.bonuses?.reduce((sum, b) => sum + b.amount, 0) || 0
    const totalDeductions = validatedData.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0
    const netPay = baseSalary + totalBonuses - totalDeductions

    // Create mock payroll record
    const payroll = {
      id: String(Date.now()),
      userId: validatedData.userId,
      projectId,
      period: validatedData.period,
      hoursWorked: validatedData.hoursWorked,
      hourlyRate: validatedData.hourlyRate,
      baseSalary,
      totalBonuses,
      totalDeductions,
      netPay,
      status: 'PENDING',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: validatedData.userId,
        name: 'Employee',
        position: 'Worker',
        department: 'Department'
      },
      bonuses: validatedData.bonuses || [],
      deductions: validatedData.deductions || []
    }

    return NextResponse.json(payroll)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating payroll record:', error)
    return NextResponse.json(
      { error: 'Failed to create payroll record' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[projectId]/payroll/[payrollId] - Update payroll status
const updatePayrollSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED']).optional(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'CHECK']).optional(),
  paymentDate: z.string().datetime().optional(),
  bankReference: z.string().optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // const session = await getServerSession(authOptions) // Temporarily disabled for client demo
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const payrollId = searchParams.get('payrollId')

    if (!payrollId) {
      return NextResponse.json(
        { error: 'payrollId is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updatePayrollSchema.parse(body)

    // Mock update payroll record
    const updated = {
      id: payrollId,
      ...validatedData,
      paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : undefined,
      updatedAt: new Date(),
      user: {
        id: 'user1',
        name: 'Employee',
        position: 'Worker'
      },
      bonuses: [],
      deductions: []
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating payroll record:', error)
    return NextResponse.json(
      { error: 'Failed to update payroll record' },
      { status: 500 }
    )
  }
}