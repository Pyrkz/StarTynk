import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/features/auth/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { EquipmentStatus, EquipmentHistoryAction } from '@/lib/prisma-types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const equipmentId = id;

    // Fetch equipment with all relations
    const equipment = await prisma.equipment.findUnique({
      where: { 
        id: equipmentId,
        isActive: true 
      },
      include: {
        category: true,
        assignments: {
          where: { isActive: true },
          include: {
            user: {
              select: { 
                id: true, 
                name: true, 
                email: true, 
                position: true 
              },
            },
          },
          orderBy: { assignedDate: 'desc' },
        },
        history: {
          orderBy: { actionDate: 'desc' },
        },
        _count: {
          select: {
            assignments: true,
            history: true,
          },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Format history with user names
    const formattedHistory = await Promise.all(
      equipment.history.map(async (entry) => {
        let userName = null;
        if (entry.userId) {
          const user = await prisma.user.findUnique({
            where: { id: entry.userId },
            select: { name: true },
          });
          userName = user?.name || null;
        }

        return {
          id: entry.id,
          action: entry.action,
          description: entry.description,
          actionDate: entry.actionDate,
          userId: entry.userId,
          userName,
          details: {
            // Add any additional details from the description or other fields
            // This could be parsed from JSON if stored that way
          },
        };
      })
    );

    return NextResponse.json({
      equipment,
      history: formattedHistory,
    });
  } catch (error) {
    console.error('Error fetching equipment detail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const equipmentId = id;
    const body = await request.json();

    // Validate equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: equipmentId, isActive: true },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      );
    }

    const {
      name,
      categoryId,
      serialNumber,
      purchaseDate,
      purchasePrice,
      condition,
      description,
      imageUrl,
      status,
    } = body;

    // Validate category if provided
    if (categoryId && categoryId !== existingEquipment.categoryId) {
      const category = await prisma.equipmentCategory.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
    }

    // Check if status change is valid
    if (status && status !== existingEquipment.status) {
      // Validate status transitions
      const validTransitions: Record<EquipmentStatus, EquipmentStatus[]> = {
        AVAILABLE: ['ASSIGNED', 'DAMAGED', 'RETIRED'],
        ASSIGNED: ['AVAILABLE', 'DAMAGED', 'RETIRED'],
        DAMAGED: ['AVAILABLE', 'RETIRED'], // After repair, it becomes available
        RETIRED: [], // Cannot change from retired
      };

      const allowedTransitions = validTransitions[existingEquipment.status];
      if (!allowedTransitions.includes(status as EquipmentStatus)) {
        return NextResponse.json(
          { error: `Cannot change status from ${existingEquipment.status} to ${status}` },
          { status: 400 }
        );
      }

      // If changing to ASSIGNED, ensure it's not already assigned
      if (status === 'ASSIGNED') {
        const activeAssignment = await prisma.equipmentAssignment.findFirst({
          where: {
            equipmentId,
            isActive: true,
          },
        });

        if (activeAssignment) {
          return NextResponse.json(
            { error: 'Equipment is already assigned' },
            { status: 400 }
          );
        }
      }
    }

    // Update equipment
    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        ...(name && { name }),
        ...(categoryId && { categoryId }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(purchaseDate && { purchaseDate: new Date(purchaseDate) }),
        ...(purchasePrice !== undefined && { 
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null 
        }),
        ...(condition && { condition }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(status && { status: status as EquipmentStatus }),
        updatedAt: new Date(),
      },
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
      },
    });

    // Create history entry for status change
    if (status && status !== existingEquipment.status) {
      let historyAction: EquipmentHistoryAction;
      let historyDescription = '';

      switch (status) {
        case 'DAMAGED':
          historyAction = EquipmentHistoryAction.DAMAGED;
          historyDescription = `Equipment marked as damaged`;
          break;
        case 'AVAILABLE':
          if (existingEquipment.status === 'DAMAGED') {
            historyAction = EquipmentHistoryAction.REPAIRED;
            historyDescription = `Equipment repaired and returned to service`;
          } else {
            historyAction = EquipmentHistoryAction.RETURNED;
            historyDescription = `Equipment returned to available status`;
          }
          break;
        case 'RETIRED':
          historyAction = EquipmentHistoryAction.RETIRED;
          historyDescription = `Equipment retired from service`;
          break;
        default:
          historyAction = EquipmentHistoryAction.RETURNED; // Default fallback
          historyDescription = `Equipment status changed to ${status}`;
      }

      await prisma.equipmentHistory.create({
        data: {
          equipmentId,
          action: historyAction,
          description: historyDescription,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(updatedEquipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const equipmentId = id;

    // Check if equipment exists and is not currently assigned
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId, isActive: true },
      include: {
        assignments: {
          where: { isActive: true },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if equipment is currently assigned
    if (equipment.assignments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete equipment that is currently assigned' },
        { status: 400 }
      );
    }

    // Soft delete the equipment
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Create history entry
    await prisma.equipmentHistory.create({
      data: {
        equipmentId,
        action: EquipmentHistoryAction.RETIRED,
        description: `Equipment deleted by ${session.user.name}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}