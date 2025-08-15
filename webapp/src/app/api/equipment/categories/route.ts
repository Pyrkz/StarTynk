import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/features/auth/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { EquipmentStatus } from '@/lib/prisma-types';

interface EquipmentWithStatus {
  id: string;
  status: EquipmentStatus;
}

interface CategoryWithEquipment {
  equipment: EquipmentWithStatus[];
  _count: { equipment: number };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    if (includeStats) {
      // Fetch categories with detailed statistics
      const categories = await prisma.equipmentCategory.findMany({
        where: { isActive: true },
        include: {
          equipment: {
            where: { isActive: true },
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              equipment: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Calculate stats for each category
      const categoriesWithStats = categories.map((category: CategoryWithEquipment) => {
        const equipment = category.equipment;
        const stats = {
          total: equipment.length,
          available: equipment.filter((e: EquipmentWithStatus) => e.status === 'AVAILABLE').length,
          assigned: equipment.filter((e: EquipmentWithStatus) => e.status === 'ASSIGNED').length,
          damaged: equipment.filter((e: EquipmentWithStatus) => e.status === 'DAMAGED').length,
          retired: equipment.filter((e: EquipmentWithStatus) => e.status === 'RETIRED').length,
        };

        return {
          ...category,
          stats,
        };
      });

      return NextResponse.json({
        categories: categoriesWithStats,
        totalEquipment: categories.reduce((sum: number, cat: CategoryWithEquipment) => sum + cat._count.equipment, 0),
      });
    } else {
      // Simple category list without stats
      const categories = await prisma.equipmentCategory.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({ categories });
    }
  } catch (error) {
    console.error('Error fetching equipment categories:', error);
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

    // Check if user has admin privileges
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category with same name already exists
    const existingCategory = await prisma.equipmentCategory.findFirst({
      where: {
        name: { equals: name },
        isActive: true,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      );
    }

    // Create category
    const category = await prisma.equipmentCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}