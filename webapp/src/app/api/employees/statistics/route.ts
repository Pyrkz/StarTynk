import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth-options";
import { prisma } from "@/lib/prisma";
import type { EmployeeStatistics } from "@/features/employees/types/employee.types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get employee counts
    const [totalEmployees, activeEmployees, temporaryEmployees] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null,
          role: { in: ["USER", "WORKER", "COORDINATOR"] },
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          isActive: true,
          role: { in: ["USER", "WORKER", "COORDINATOR"] },
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          employmentType: "TEMPORARY",
          role: { in: ["USER", "WORKER", "COORDINATOR"] },
        },
      }),
    ]);

    // Get employees on leave
    const onLeaveEmployees = await prisma.user.count({
      where: {
        deletedAt: null,
        role: { in: ["USER", "WORKER", "COORDINATOR"] },
        leaveRequests: {
          some: {
            status: "APPROVED",
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
      },
    });

    // Get equipment statistics
    const [totalEquipmentAssigned, activeEquipment] = await Promise.all([
      prisma.equipmentAssignment.count({
        where: {
          isActive: true,
          returnDate: null,
        },
      }),
      prisma.equipmentAssignment.count({
        where: {
          isActive: true,
          returnDate: null,
          equipment: {
            status: "ASSIGNED",
          },
        },
      }),
    ]);

    const inRepairEquipment = await prisma.equipmentAssignment.count({
      where: {
        isActive: true,
        returnDate: null,
        equipment: {
          status: "DAMAGED",
        },
      },
    });

    // Get task statistics
    const activeTasks = await prisma.taskAssignment.count({
      where: {
        isActive: true,
        task: {
          status: { in: ["NEW", "IN_PROGRESS", "READY_FOR_PICKUP"] },
        },
      },
    });

    // Tasks completed this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    const completedTasksThisWeek = await prisma.taskAssignment.count({
      where: {
        isActive: true,
        task: {
          status: "PAID",
          updatedAt: { gte: weekStart },
        },
      },
    });

    // Calculate average quality score
    const qualityControls = await prisma.qualityControl.findMany({
      where: {
        status: "APPROVED",
        isActive: true,
      },
      select: {
        completionRate: true,
      },
    });

    const averageQualityScore = qualityControls.length > 0
      ? Math.round(
          qualityControls.reduce((sum: number, control: any) => sum + control.completionRate, 0) /
          qualityControls.length
        )
      : 0;

    // Calculate task completion rate
    const totalTasks = await prisma.taskAssignment.count({
      where: {
        isActive: true,
      },
    });

    const completedTasks = await prisma.taskAssignment.count({
      where: {
        isActive: true,
        task: {
          status: "PAID",
        },
      },
    });

    const taskCompletionRate = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    const statistics: EmployeeStatistics = {
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      temporaryEmployees,
      totalEquipmentAssigned,
      activeEquipment,
      inRepairEquipment,
      activeTasks,
      completedTasksThisWeek,
      averageQualityScore,
      taskCompletionRate,
    };

    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Error fetching employee statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}