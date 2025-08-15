// Projects Financial Data API Endpoint
// GET /api/finance/projects - Detailed financial data for all projects

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/features/auth/lib/auth-options';
import { getProjectFinancialSummaries } from '@/lib/financial-aggregations';
import type { ProjectFinancialTableResponse } from '@/types/finance';

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
    
    // Parse query parameters
    const status = searchParams.getAll('status');
    const managerId = searchParams.get('managerId');
    const startDate = searchParams.get('startDate') ? 
      new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? 
      new Date(searchParams.get('endDate')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Get project financial summaries
    const filters = {
      status: status.length > 0 ? status : undefined,
      managerId: managerId || undefined,
      startDate,
      endDate
    };

    let projects = await getProjectFinancialSummaries(filters);

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      projects = projects.filter(project => 
        project.name.toLowerCase().includes(searchLower) ||
        project.manager.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    projects.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'budget':
          aValue = Number(a.budget.original);
          bValue = Number(b.budget.original);
          break;
        case 'costs':
          aValue = Number(a.costs.total);
          bValue = Number(b.costs.total);
          break;
        case 'revenue':
          aValue = Number(a.revenue.total);
          bValue = Number(b.revenue.total);
          break;
        case 'margin':
          aValue = a.margin.percentage;
          bValue = b.margin.percentage;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? 
          aValue.localeCompare(bValue) : 
          bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    // Calculate pagination
    const total = projects.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProjects = projects.slice(startIndex, endIndex);

    // Calculate summary statistics
    const summary = {
      totalProjects: total,
      totalBudget: projects.reduce((sum, p) => sum.add(p.budget.original), new Decimal(0)),
      totalCosts: projects.reduce((sum, p) => sum.add(p.costs.total), new Decimal(0)),
      totalRevenue: projects.reduce((sum, p) => sum.add(p.revenue.total), new Decimal(0)),
      averageMargin: total > 0 ? 
        projects.reduce((sum, p) => sum + p.margin.percentage, 0) / total : 0
    };

    const response: ProjectFinancialTableResponse = {
      projects: paginatedProjects,
      pagination: {
        page,
        limit,
        total,
        pages
      },
      summary
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching project financial data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch project financial data',
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