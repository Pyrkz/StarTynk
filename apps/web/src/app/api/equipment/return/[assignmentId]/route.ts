import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/features/auth/lib/auth-options';
import { prisma } from '@repo/database';
import { EquipmentHistoryAction } from '@repo/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId } = await params;
    const body = await request.json();
    const { notes, condition } = body;

    // Find the assignment
    const assignment = await prisma.equipmentAssignment.findUnique({
      where: { 
        id: assignmentId,
        isActive: true 
      },
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or already returned' },
        { status: 404 }
      );
    }

    // Perform the return in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the assignment to mark as returned
      const updatedAssignment = await tx.equipmentAssignment.update({
        where: { id: assignmentId },
        data: {
          isActive: false,
          returnDate: new Date(),
          notes: notes ? `${assignment.notes || ''} | Return notes: ${notes}` : assignment.notes,
        },
        include: {
          equipment: {
            include: {
              category: true,
            },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Update equipment status and condition
      const equipmentUpdate: any = {
        status: 'AVAILABLE',
        updatedAt: new Date(),
      };

      // Update condition if provided
      if (condition) {
        equipmentUpdate.condition = condition;
        
        // If equipment is returned in damaged condition, mark as damaged
        if (condition === 'damaged' || condition === 'poor') {
          equipmentUpdate.status = 'DAMAGED';
        }
      }

      await tx.equipment.update({
        where: { id: assignment.equipment.id },
        data: equipmentUpdate,
      });

      // Create history entry
      const historyAction = condition === 'damaged' || condition === 'poor' 
        ? EquipmentHistoryAction.DAMAGED 
        : EquipmentHistoryAction.RETURNED;
      
      const historyDescription = condition === 'damaged' || condition === 'poor'
        ? `Equipment returned by ${assignment.user.name} in damaged condition${notes ? ` - ${notes}` : ''}`
        : `Equipment returned by ${assignment.user.name}${notes ? ` - ${notes}` : ''}`;

      await tx.equipmentHistory.create({
        data: {
          equipmentId: assignment.equipment.id,
          action: historyAction,
          description: historyDescription,
          userId: session.user.id,
        },
      });

      return updatedAssignment;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error returning equipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}