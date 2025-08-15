import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth-options";
import { prisma } from "@/lib/prisma";
import type { EmployeeWithRelations } from "@/features/employees/types/employee.types";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const department = searchParams.get("department");
    const projectId = searchParams.get("projectId");
    const search = searchParams.get("search");

    const where: any = {
      deletedAt: null,
      role: { in: ["USER", "WORKER", "COORDINATOR"] },
    };

    // Filter by status
    if (status === "active") {
      where.isActive = true;
      where.leaveRequests = {
        none: {
          status: "APPROVED",
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      };
    } else if (status === "leave") {
      where.leaveRequests = {
        some: {
          status: "APPROVED",
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      };
    } else if (status === "temporary") {
      where.employmentType = "TEMPORARY";
    }

    // Filter by department
    if (department) {
      where.department = department;
    }

    // Filter by project
    if (projectId) {
      where.projectAssignments = {
        some: {
          projectId,
          isActive: true,
        },
      };
    }

    // Search by name, email, or employee ID
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
        equipmentAssignments: {
          where: { isActive: true },
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                categoryId: true,
                status: true,
                imageUrl: true,
              },
            },
          },
        },
        taskAssignments: {
          where: { isActive: true },
          include: {
            task: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                qualityControls: true,
              },
            },
          },
        },
        projectAssignments: {
          where: { isActive: true },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        payrollRecords: {
          orderBy: { createdAt: "desc" },
          take: 12,
        },
        bonuses: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        deductions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        attendanceRecords: {
          orderBy: { date: "desc" },
          take: 30,
        },
        leaveRequests: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform the data to match the expected types
    const transformedEmployees: EmployeeWithRelations[] = employees.map(employee => ({
      ...employee,
      hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : null, // Convert Decimal to number
      taskAssignments: employee.taskAssignments.map(assignment => ({
        ...assignment,
        task: {
          ...assignment.task,
          area: Number(assignment.task.area), // Convert Decimal to number
          rate: Number(assignment.task.rate), // Convert Decimal to number
        }
      })),
      payrollRecords: employee.payrollRecords.map(record => ({
        ...record,
        hoursWorked: Number(record.hoursWorked),
        hourlyRate: Number(record.hourlyRate),
        baseSalary: Number(record.baseSalary),
        totalBonuses: Number(record.totalBonuses),
        totalDeductions: Number(record.totalDeductions),
        netPay: Number(record.netPay),
      })),
      bonuses: employee.bonuses.map(bonus => ({
        ...bonus,
        amount: Number(bonus.amount),
      })),
      deductions: employee.deductions.map(deduction => ({
        ...deduction,
        amount: Number(deduction.amount),
      })),
      attendanceRecords: employee.attendanceRecords.map(record => ({
        ...record,
        hoursWorked: record.hoursWorked ? Number(record.hoursWorked) : null,
        overtimeHours: record.overtimeHours ? Number(record.overtimeHours) : null,
      }))
    }));

    return NextResponse.json(transformedEmployees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}