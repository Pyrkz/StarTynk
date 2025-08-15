import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth-options";
import { prisma } from "@/lib/prisma";
import type { EmployeePayrollData } from "@/features/employees/types/employee.types";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const periodStart = searchParams.get("periodStart");
    const periodEnd = searchParams.get("periodEnd");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const search = searchParams.get("search");

    // Get current month's start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Base query for employees with payroll data
    const where: any = {
      deletedAt: null,
      role: { in: ["USER", "WORKER", "COORDINATOR"] },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
      ];
    }

    const employees = await prisma.user.findMany({
      where,
      include: {
        taskAssignments: {
          where: {
            isActive: true,
            task: {
              updatedAt: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          },
          include: {
            task: {
              include: {
                qualityControls: {
                  where: {
                    status: "APPROVED",
                  },
                },
              },
            },
          },
        },
        attendanceRecords: {
          where: {
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        },
        payrollRecords: {
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        bonuses: {
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        },
      },
    });

    // Transform data to EmployeePayrollData format
    const payrollData: EmployeePayrollData[] = employees.map((employee: any) => {
      // Calculate tasks completed
      const tasksCompleted = employee.taskAssignments.filter(
        (assignment: any) => assignment.task.status === "PAID"
      ).length;

      // Calculate total hours worked
      const totalHours = employee.attendanceRecords.reduce(
        (sum: number, record: any) => sum + (Number(record.hoursWorked) || 0),
        0
      );

      // Calculate average quality score
      const qualityScores = employee.taskAssignments
        .flatMap((assignment: any) => assignment.task.qualityControls)
        .map((control: any) => control.completionRate);
      
      const qualityScore = qualityScores.length > 0
        ? Math.round(qualityScores.reduce((sum: number, score: number) => sum + score, 0) / qualityScores.length)
        : 0;

      // Calculate earnings
      const hourlyRate = Number(employee.hourlyRate) || 0;
      const baseEarnings = totalHours * hourlyRate;
      
      // Calculate quality bonus (10% of base if quality > 90%)
      const qualityBonus = qualityScore >= 90 ? baseEarnings * 0.1 : 0;
      
      // Add other bonuses
      const otherBonuses = employee.bonuses.reduce(
        (sum: number, bonus: any) => sum + Number(bonus.amount),
        0
      );
      
      const totalEarnings = baseEarnings + qualityBonus + otherBonuses;

      // Get latest payroll record
      const latestPayroll = employee.payrollRecords[0];

      return {
        userId: employee.id,
        name: employee.name,
        employeeId: employee.employeeId,
        position: employee.position,
        image: employee.image,
        tasksCompleted,
        totalHours,
        qualityScore,
        baseEarnings,
        qualityBonus: qualityBonus + otherBonuses,
        totalEarnings,
        paymentStatus: latestPayroll?.status || "PENDING",
        paymentDate: latestPayroll?.paymentDate || null,
        paymentMethod: latestPayroll?.paymentMethod || null,
      };
    });

    // Apply filters
    let filteredData = payrollData;

    if (status) {
      filteredData = filteredData.filter((item) => item.paymentStatus === status);
    }

    if (minAmount) {
      const min = parseFloat(minAmount);
      filteredData = filteredData.filter((item) => item.totalEarnings >= min);
    }

    if (maxAmount) {
      const max = parseFloat(maxAmount);
      filteredData = filteredData.filter((item) => item.totalEarnings <= max);
    }

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error("Error fetching payroll data:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll data" },
      { status: 500 }
    );
  }
}