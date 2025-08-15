import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/features/auth/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { EquipmentStatus } from '@/lib/prisma-types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { categoryId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Sorting
    const sortField = searchParams.get('sortField') || 'name';
    const sortDirection = searchParams.get('sortDirection') || 'asc';

    // Filters
    const search = searchParams.get('search');
    const status = searchParams.get('status') as EquipmentStatus | null;
    const condition = searchParams.get('condition');

    // First, check if category exists
    const category = await prisma.equipmentCategory.findUnique({
      where: { 
        id: categoryId,
        isActive: true 
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Build where clause for equipment
    const where: any = {
      categoryId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (condition) {
      where.condition = condition;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortField === 'assignedDate') {
      orderBy.assignments = {
        _count: sortDirection,
      };
    } else {
      orderBy[sortField] = sortDirection;
    }

    // Fetch equipment for this category
    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        include: {
          category: true,
          assignments: {
            where: { isActive: true },
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          _count: {
            select: {
              assignments: true,
              history: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.equipment.count({ where }),
    ]);

    // Calculate category statistics
    const categoryStats = await prisma.equipment.groupBy({
      by: ['status'],
      where: { 
        categoryId,
        isActive: true 
      },
      _count: true,
    });

    const stats = {
      total: 0,
      available: 0,
      assigned: 0,
      damaged: 0,
      retired: 0,
    };

    categoryStats.forEach((stat) => {
      const count = stat._count;
      stats.total += count;
      
      switch (stat.status) {
        case 'AVAILABLE':
          stats.available = count;
          break;
        case 'ASSIGNED':
          stats.assigned = count;
          break;
        case 'DAMAGED':
          stats.damaged = count;
          break;
        case 'RETIRED':
          stats.retired = count;
          break;
      }
    });

    // Prepare category with stats
    const categoryWithStats = {
      ...category,
      stats,
      equipment: [], // We're returning equipment separately
      _count: {
        equipment: stats.total,
      },
    };

    return NextResponse.json({
      category: categoryWithStats,
      equipment,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching category equipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}