// Financial Categories API Endpoint
// GET /api/finance/categories - Revenue and expense category breakdowns

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/features/auth/lib/auth-options';
import { getExpenseCategoryBreakdown } from '@/lib/financial-aggregations';
import { calculateCategoryBreakdown } from '@/lib/financial-calculations';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const type = searchParams.get('type') || 'both'; // 'revenue', 'expenses', or 'both'
    
    // Default to current year if no dates provided
    const currentYear = new Date().getFullYear();
    const startDate = startDateParam ? 
      new Date(startDateParam) : 
      new Date(currentYear, 0, 1);
    const endDate = endDateParam ? 
      new Date(endDateParam) : 
      new Date(currentYear, 11, 31);

    let expenseBreakdown: any[] = [];
    let revenueBreakdown: any[] = [];

    // Get expense breakdown
    if (type === 'expenses' || type === 'both') {
      expenseBreakdown = await getExpenseCategoryBreakdown(startDate, endDate);
    }

    // Get revenue breakdown (by project type/category)
    if (type === 'revenue' || type === 'both') {
      const revenueByProject = await prisma.paymentCalculation.groupBy({
        by: ['taskId'],
        where: {
          isPaid: true,
          paidAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          amount: true
        }
      });

      // Get project types/categories for revenue breakdown
      const projectTypes = await prisma.project.findMany({
        where: {
          tasks: {
            some: {
              payments: {
                some: {
                  taskId: {
                    in: revenueByProject.map(r => r.taskId)
                  }
                }
              }
            }
          }
        },
        select: {
          id: true,
          name: true,
          tasks: {
            select: {
              id: true,
              payments: {
                where: {
                  isPaid: true,
                  paidAt: {
                    gte: startDate,
                    lte: endDate
                  }
                },
                select: {
                  amount: true
                }
              }
            }
          }
        }
      });

      // Calculate revenue by project category (simplified - using project name patterns)
      const revenueCategories = projectTypes.reduce((acc: Record<string, number>, project) => {
        const totalRevenue = project.tasks.reduce((sum, task) => {
          const taskRevenue = task.payments.reduce((paySum, payment) => 
            paySum + Number(payment.amount), 0);
          return sum + taskRevenue;
        }, 0);

        // Categorize by project name patterns (simplified)
        let category = 'Other';
        if (project.name.toLowerCase().includes('residential')) category = 'Residential';
        else if (project.name.toLowerCase().includes('commercial')) category = 'Commercial';
        else if (project.name.toLowerCase().includes('industrial')) category = 'Industrial';
        else if (project.name.toLowerCase().includes('renovation')) category = 'Renovation';

        acc[category] = (acc[category] || 0) + totalRevenue;
        return acc;
      }, {});

      revenueBreakdown = calculateCategoryBreakdown(
        Object.entries(revenueCategories).map(([name, amount]) => ({ name, amount }))
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        expenses: expenseBreakdown,
        revenue: revenueBreakdown,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        summary: {
          totalExpenses: expenseBreakdown.reduce((sum, cat) => sum + cat.amount, 0),
          totalRevenue: revenueBreakdown.reduce((sum, cat) => sum + cat.amount, 0),
          expenseCategories: expenseBreakdown.length,
          revenueCategories: revenueBreakdown.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch category breakdown',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}