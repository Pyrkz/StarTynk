import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/features/auth/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { EquipmentHistoryAction } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { equipmentId, userId, notes, expectedReturnDate } = body;

    // Validate required fields
    if (!equipmentId || !userId) {
      return NextResponse.json(
        { error: 'Equipment ID and User ID are required' },
        { status: 400 }
      );
    }

    // Check if equipment exists and is available
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

    if (equipment.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Equipment is not available for assignment' },
        { status: 400 }
      );
    }

    // Check if equipment is already assigned
    if (equipment.assignments.length > 0) {
      return NextResponse.json(
        { error: 'Equipment is already assigned to another user' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Perform the assignment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the assignment
      const assignment = await tx.equipmentAssignment.create({
        data: {
          equipmentId,
          userId,
          notes,
          ...(expectedReturnDate && { 
            // Store expected return date in notes for now, as it's not in the schema
            notes: `${notes ? notes + ' | ' : ''}Expected return: ${expectedReturnDate}` 
          }),
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

      // Update equipment status to ASSIGNED
      await tx.equipment.update({
        where: { id: equipmentId },
        data: { status: 'ASSIGNED' },
      });

      // Create history entry
      await tx.equipmentHistory.create({
        data: {
          equipmentId,
          action: EquipmentHistoryAction.ASSIGNED,
          description: `Equipment assigned to ${user.name}${notes ? ` - ${notes}` : ''}`,
          userId: session.user.id,
        },
      });

      return assignment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error assigning equipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}