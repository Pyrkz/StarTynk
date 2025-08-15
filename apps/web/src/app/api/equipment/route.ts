import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/features/auth/lib/auth-options';
import { prisma } from '@repo/database';
import { EquipmentStatus, EquipmentHistoryAction } from '@repo/shared/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status')?.split(',') as EquipmentStatus[] | undefined;
    const condition = searchParams.get('condition')?.split(',');
    const assignedTo = searchParams.get('assignedTo');

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (condition && condition.length > 0) {
      where.condition = { in: condition };
    }

    if (assignedTo) {
      where.assignments = {
        some: {
          userId: assignedTo,
          isActive: true,
        },
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortField === 'category') {
      orderBy.category = { name: sortDirection };
    } else if (sortField === 'assignedDate') {
      orderBy.assignments = {
        _count: sortDirection,
      };
    } else {
      orderBy[sortField] = sortDirection;
    }

    // Fetch equipment with relations
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

    // Calculate stats
    const statsResult = await prisma.equipment.groupBy({
      by: ['status'],
      where: { isActive: true },
      _count: true,
    });

    const stats = {
      total: 0,
      available: 0,
      assigned: 0,
      damaged: 0,
      retired: 0,
      utilizationRate: 0,
      maintenanceRequired: 0,
    };

    statsResult.forEach((stat) => {
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

    stats.utilizationRate = stats.total > 0 ? (stats.assigned / stats.total) * 100 : 0;
    stats.maintenanceRequired = stats.damaged; // Simplified for now

    return NextResponse.json({
      equipment,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      categoryId,
      serialNumber,
      purchaseDate,
      purchasePrice,
      condition,
      description,
      imageUrl,
    } = body;

    // Validate required fields
    if (!name || !categoryId) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.equipmentCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Create equipment
    const equipment = await prisma.equipment.create({
      data: {
        name,
        categoryId,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        condition,
        description,
        imageUrl,
        status: 'AVAILABLE',
      },
      include: {
        category: true,
      },
    });

    // Create history entry
    await prisma.equipmentHistory.create({
      data: {
        equipmentId: equipment.id,
        action: EquipmentHistoryAction.PURCHASED,
        description: `Equipment ${equipment.name} added to inventory`,
      },
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}