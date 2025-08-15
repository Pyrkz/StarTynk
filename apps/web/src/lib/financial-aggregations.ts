// Financial Data Aggregation Functions
// Database query aggregation functions for company-wide financial data

import { prisma } from '@repo/database';
import { Decimal } from '@repo/database';
import type {
  FinancialOverview,
  ProjectFinancialSummary,
  CashFlowData,
  CategoryBreakdown,
  ProjectPerformanceData,
  PaymentTrackingData,
  BudgetVarianceData
} from '@/types/finance';

// ========== Financial Overview Aggregation ==========

/**
 * Get comprehensive financial overview for dashboard
 */
export async function getFinancialOverview(
  startDate: Date,
  endDate: Date
): Promise<FinancialOverview> {
  // Get current period data
  const [
    projectsData,
    materialOrdersData,
    vehicleMaintenanceData,
    equipmentData,
    deliveriesData
  ] = await Promise.all([
    // Projects revenue and budgets
    prisma.project.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        tasks: {
          include: {
            payments: true
          }
        }
      }
    }),
    
    // Material costs
    prisma.materialOrder.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        isActive: true
      },
      _sum: {
        totalAmount: true
      }
    }),
    
    // Vehicle maintenance costs
    prisma.vehicleMaintenance.aggregate({
      where: {
        serviceDate: {
          gte: startDate,
          lte: endDate
        },
        isActive: true
      },
      _sum: {
        cost: true
      }
    }),
    
    // Equipment purchase costs
    prisma.equipment.aggregate({
      where: {
        purchaseDate: {
          gte: startDate,
          lte: endDate
        },
        isActive: true
      },
      _sum: {
        purchasePrice: true
      }
    }),
    
    // Delivery costs (estimated based on vehicle usage)
    prisma.delivery.count({
      where: {
        deliveryDate: {
          gte: startDate,
          lte: endDate
        },
        isActive: true
      }
    })
  ]);

  // Calculate total revenue from completed payments
  const totalRevenue = projectsData.reduce((sum, project) => {
    const projectRevenue = project.tasks.reduce((taskSum, task) => {
      const paidPayments = task.payments
        .filter(payment => payment.isPaid)
        .reduce((paySum, payment) => paySum.add(payment.amount), new Decimal(0));
      return taskSum.add(paidPayments);
    }, new Decimal(0));
    return sum.add(projectRevenue);
  }, new Decimal(0));

  // Calculate total expenses
  const materialExpenses = materialOrdersData._sum.totalAmount || new Decimal(0);
  const vehicleExpenses = vehicleMaintenanceData._sum.cost || new Decimal(0);
  const equipmentExpenses = equipmentData._sum.purchasePrice || new Decimal(0);
  const deliveryExpenses = new Decimal(deliveriesData * 150); // Estimated $150 per delivery

  const totalExpenses = materialExpenses
    .add(vehicleExpenses)
    .add(equipmentExpenses)
    .add(deliveryExpenses);

  const netProfit = totalRevenue.sub(totalExpenses);
  const profitMargin = totalRevenue.eq(0) ? 0 : 
    Number(netProfit.div(totalRevenue).mul(100));

  // Active projects value
  const activeProjectsValue = projectsData
    .filter(p => p.status === 'ACTIVE')
    .reduce((sum, p) => sum.add(p.baseRate.mul(1000)), new Decimal(0)); // Assuming baseRate * 1000 hours average

  const activeProjectsCount = projectsData.filter(p => p.status === 'ACTIVE').length;

  // Pipeline value (projects in planning)
  const pipelineValue = projectsData
    .filter(p => p.status === 'PLANNING')
    .reduce((sum, p) => sum.add(p.baseRate.mul(800)), new Decimal(0)); // Estimated value

  // Get previous year data for YoY growth
  const previousYearStart = new Date(startDate);
  previousYearStart.setFullYear(previousYearStart.getFullYear() - 1);
  const previousYearEnd = new Date(endDate);
  previousYearEnd.setFullYear(previousYearEnd.getFullYear() - 1);

  const previousYearOverview = await getBasicFinancialData(previousYearStart, previousYearEnd);

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    activeProjectsValue,
    activeProjectsCount,
    pipelineValue,
    yearOverYearGrowth: {
      revenue: calculateGrowthPercentage(totalRevenue, previousYearOverview.revenue),
      expenses: calculateGrowthPercentage(totalExpenses, previousYearOverview.expenses),
      profit: calculateGrowthPercentage(netProfit, previousYearOverview.profit)
    }
  };
}

// ========== Project Financial Summaries ==========

/**
 * Get detailed financial summaries for all projects
 */
export async function getProjectFinancialSummaries(
  filters?: {
    status?: string[];
    managerId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ProjectFinancialSummary[]> {
  const whereClause: any = {
    isActive: true
  };

  if (filters?.status?.length) {
    whereClause.status = { in: filters.status };
  }

  if (filters?.managerId) {
    whereClause.coordinatorId = filters.managerId;
  }

  if (filters?.startDate && filters?.endDate) {
    whereClause.createdAt = {
      gte: filters.startDate,
      lte: filters.endDate
    };
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      coordinator: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      tasks: {
        include: {
          payments: true
        }
      },
      materialOrders: {
        where: {
          isActive: true
        },
        include: {
          items: {
            include: {
              material: true
            }
          }
        }
      },
      vehicleAssignments: {
        include: {
          vehicle: {
            include: {
              maintenances: {
                where: {
                  isActive: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return projects.map(project => {
    // Calculate project costs
    const laborCosts = new Decimal(0); // Payroll data not available

    const materialCosts = project.materialOrders.reduce(
      (sum, order) => sum.add(order.totalAmount || 0),
      new Decimal(0)
    );

    const vehicleCosts = project.vehicleAssignments.reduce((sum, assignment) => {
      const maintenanceCosts = assignment.vehicle.maintenances.reduce(
        (mSum, maintenance) => mSum.add(maintenance.cost),
        new Decimal(0)
      );
      return sum.add(maintenanceCosts);
    }, new Decimal(0));

    const equipmentCosts = new Decimal(0); // Would need to calculate from equipment assignments

    const totalCosts = laborCosts.add(materialCosts).add(vehicleCosts).add(equipmentCosts);

    // Calculate project revenue
    const totalRevenue = project.tasks.reduce((sum, task) => {
      const taskRevenue = task.payments
        .filter(payment => payment.isPaid)
        .reduce((paySum, payment) => paySum.add(payment.amount), new Decimal(0));
      return sum.add(taskRevenue);
    }, new Decimal(0));

    const pendingRevenue = project.tasks.reduce((sum, task) => {
      const taskPending = task.payments
        .filter(payment => !payment.isPaid)
        .reduce((paySum, payment) => paySum.add(payment.amount), new Decimal(0));
      return sum.add(taskPending);
    }, new Decimal(0));

    // Calculate budget information
    const originalBudget = project.baseRate.mul(1000); // Estimated based on base rate
    const budgetUtilization = originalBudget.eq(0) ? 0 : 
      Number(totalCosts.div(originalBudget).mul(100));

    // Calculate margins
    const profit = totalRevenue.sub(totalCosts);
    const marginPercentage = totalRevenue.eq(0) ? 0 : 
      Number(profit.div(totalRevenue).mul(100));

    // Determine payment status
    const overduePayments = project.tasks.some(task => 
      task.payments.some(payment => 
        !payment.isPaid && payment.createdAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      )
    );

    let paymentStatus: 'current' | 'overdue' | 'partial' | 'completed';
    if (overduePayments) {
      paymentStatus = 'overdue';
    } else if (pendingRevenue.gt(0)) {
      paymentStatus = 'partial';
    } else if (totalRevenue.gt(0)) {
      paymentStatus = 'completed';
    } else {
      paymentStatus = 'current';
    }

    return {
      id: project.id,
      name: project.name,
      status: project.status as 'Active' | 'Completed' | 'On Hold' | 'Planning',
      manager: {
        id: project.coordinator?.id || '',
        name: project.coordinator?.name || 'Unassigned',
        avatar: project.coordinator?.image
      },
      startDate: project.startDate,
      budget: {
        original: originalBudget,
        current: originalBudget,
        utilization: budgetUtilization,
        variance: budgetUtilization - 100,
        status: budgetUtilization > 110 ? 'critical' : 
               budgetUtilization > 90 ? 'warning' : 'healthy'
      },
      costs: {
        total: totalCosts,
        thisMonth: new Decimal(0), // Would need monthly calculation
        breakdown: {
          labor: laborCosts,
          materials: materialCosts,
          equipment: equipmentCosts,
          other: vehicleCosts
        },
        trend: 'stable' // Would need historical data
      },
      revenue: {
        total: totalRevenue,
        invoiced: totalRevenue,
        pending: pendingRevenue,
        paymentStatus
      },
      margin: {
        amount: profit,
        percentage: marginPercentage,
        target: 20,
        rating: marginPercentage >= 20 ? 5 : 
               marginPercentage >= 15 ? 4 :
               marginPercentage >= 10 ? 3 :
               marginPercentage >= 5 ? 2 : 1
      },
      paymentStatus: {
        status: paymentStatus === 'current' ? 'Current' :
               paymentStatus === 'overdue' ? 'Overdue' :
               paymentStatus === 'partial' ? 'Partial' : 'Completed',
        daysOutstanding: overduePayments ? 30 : undefined, // Would calculate actual days
        nextPaymentDue: pendingRevenue.gt(0) ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined
      }
    };
  });
}

// ========== Cash Flow Data ==========

/**
 * Get monthly cash flow data for specified period
 */
export async function getCashFlowData(
  startDate: Date,
  endDate: Date
): Promise<CashFlowData[]> {
  const monthlyData: CashFlowData[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Get inflows (client payments)
    const payments = await prisma.paymentCalculation.aggregate({
      where: {
        isPaid: true,
        paidAt: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      _sum: {
        amount: true
      }
    });

    // Get outflows
    const [materialOutflows, vehicleOutflows] = await Promise.all([
      prisma.materialOrder.aggregate({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          },
          status: { not: 'CANCELLED' }
        },
        _sum: {
          totalAmount: true
        }
      }),
      
      prisma.vehicleMaintenance.aggregate({
        where: {
          serviceDate: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: {
          cost: true
        }
      })
    ]);

    const clientPayments = Number(payments._sum.amount || 0);
    const payroll = 0; // Payroll data not available
    const materials = Number(materialOutflows._sum.totalAmount || 0);
    const equipment = Number(vehicleOutflows._sum.cost || 0);
    const overhead = (payroll + materials + equipment) * 0.1; // Estimated 10% overhead

    const totalInflows = clientPayments;
    const totalOutflows = payroll + materials + equipment + overhead;
    const netCashFlow = totalInflows - totalOutflows;

    monthlyData.push({
      period: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
      date: new Date(monthStart),
      inflows: {
        clientPayments,
        otherIncome: 0,
        total: totalInflows
      },
      outflows: {
        payroll,
        materials,
        equipment,
        overhead,
        total: totalOutflows
      },
      netCashFlow,
      cumulativeCashFlow: monthlyData.length > 0 ? 
        monthlyData[monthlyData.length - 1].cumulativeCashFlow + netCashFlow : netCashFlow
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return monthlyData;
}

// ========== Category Breakdowns ==========

/**
 * Get expense category breakdown
 */
export async function getExpenseCategoryBreakdown(
  startDate: Date,
  endDate: Date
): Promise<CategoryBreakdown[]> {
  const [materialTotal, vehicleTotal, equipmentTotal] = await Promise.all([
    prisma.materialOrder.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        isActive: true
      },
      _sum: { totalAmount: true }
    }),
    
    prisma.vehicleMaintenance.aggregate({
      where: {
        serviceDate: { gte: startDate, lte: endDate },
        isActive: true
      },
      _sum: { cost: true }
    }),
    
    prisma.equipment.aggregate({
      where: {
        purchaseDate: { gte: startDate, lte: endDate },
        isActive: true
      },
      _sum: { purchasePrice: true }
    })
  ]);

  const categories = [
    { name: 'Labor', amount: 0 }, // Payroll data not available
    { name: 'Materials', amount: Number(materialTotal._sum.totalAmount || 0) },
    { name: 'Equipment', amount: Number(equipmentTotal._sum.purchasePrice || 0) },
    { name: 'Vehicle Maintenance', amount: Number(vehicleTotal._sum.cost || 0) }
  ].filter(cat => cat.amount > 0);

  const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return categories.map((category, index) => ({
    category: category.name,
    amount: category.amount,
    percentage: total === 0 ? 0 : (category.amount / total) * 100,
    color: colors[index % colors.length]
  }));
}

// ========== Helper Functions ==========

/**
 * Get basic financial data for comparison purposes
 */
async function getBasicFinancialData(startDate: Date, endDate: Date) {
  const [revenue] = await Promise.all([
    prisma.paymentCalculation.aggregate({
      where: {
        isPaid: true,
        paidAt: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    })
  ]);

  const revenueAmount = revenue._sum.amount || new Decimal(0);
  const expenseAmount = new Decimal(0); // Payroll data not available

  return {
    revenue: revenueAmount,
    expenses: expenseAmount,
    profit: revenueAmount.sub(expenseAmount)
  };
}

/**
 * Calculate growth percentage between two periods
 */
function calculateGrowthPercentage(current: Decimal, previous: Decimal): number {
  if (previous.eq(0)) return current.gt(0) ? 100 : 0;
  return Number(current.sub(previous).div(previous).mul(100));
}

