// Define the employee relations type manually to avoid Prisma GetPayload issues
// This provides the same type safety without relying on problematic Prisma type exports

export interface EmployeeWithRelations {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  password: string | null
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  invitedBy: string | null
  deletedAt: Date | null
  department: string | null
  employmentEndDate: Date | null
  employmentStartDate: Date | null
  lastLoginAt: Date | null
  loginCount: number
  phone: string | null
  position: string | null
  employeeId: string | null
  hourlyRate: number | null
  employmentType: string
  bankAccount: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  skills: string | null
  certifications: string | null
  
  equipmentAssignments: Array<{
    id: string
    equipmentId: string
    userId: string
    assignedDate: Date
    returnDate: Date | null
    notes: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    equipment: {
      id: string
      name: string
      categoryId: string
      status: string
      imageUrl: string | null
    }
  }>
  
  taskAssignments: Array<{
    id: string
    taskId: string
    userId: string
    role: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    task: {
      id: string
      projectId: string
      apartmentId: string | null
      title: string
      description: string | null
      area: number
      rate: number
      status: string
      estimatedHours: number | null
      actualHours: number | null
      priority: string
      dueDate: Date | null
      isActive: boolean
      createdAt: Date
      updatedAt: Date
      deletedAt: Date | null
      qualityControls: Array<{
        id: string
        taskId: string
        controllerId: string
        controlNumber: number
        status: string
        completionRate: number
        notes: string | null
        issuesFound: string | null
        correctionsNeeded: string | null
        controlDate: Date
        recontrolDate: Date | null
        issueType: string | null
        isActive: boolean
        createdAt: Date
        updatedAt: Date
        deletedAt: Date | null
      }>
      project: {
        id: string
        name: string
      }
    }
  }>
  
  projectAssignments: Array<{
    id: string
    projectId: string
    userId: string
    role: string | null
    startDate: Date
    endDate: Date | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    project: {
      id: string
      name: string
      address: string
    }
  }>
  
  payrollRecords: Array<{
    id: string
    userId: string
    projectId: string
    period: string
    hoursWorked: number
    hourlyRate: number
    baseSalary: number
    totalBonuses: number
    totalDeductions: number
    netPay: number
    status: string
    paymentDate: Date | null
    paymentMethod: string | null
    bankReference: string | null
    notes: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }>
  
  bonuses: Array<{
    id: string
    payrollId: string
    userId: string
    type: string
    amount: number
    description: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }>
  
  deductions: Array<{
    id: string
    payrollId: string
    userId: string
    type: string
    amount: number
    description: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }>
  
  attendanceRecords: Array<{
    id: string
    userId: string
    projectId: string
    date: Date
    checkIn: Date
    checkOut: Date | null
    hoursWorked: number | null
    overtimeHours: number | null
    notes: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }>
  
  leaveRequests: Array<{
    id: string
    userId: string
    type: string
    startDate: Date
    endDate: Date
    reason: string
    status: string
    approvedById: string | null
    approvalDate: Date | null
    comments: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }>
}


export interface EmployeeStatistics {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  temporaryEmployees: number;
  totalEquipmentAssigned: number;
  activeEquipment: number;
  inRepairEquipment: number;
  activeTasks: number;
  completedTasksThisWeek: number;
  averageQualityScore: number;
  taskCompletionRate: number;
}

export interface PayrollStatistics {
  totalEmployees: number;
  monthlyPayrollTotal: number;
  outstandingPayments: number;
  pendingPaymentsCount: number;
  overduePaymentsCount: number;
  averageHourlyRate: number;
  hourlyRateRange: {
    min: number;
    max: number;
  };
  qualityBonusPool: number;
  eligibleEmployeesPercentage: number;
}

export interface EmployeePayrollData {
  userId: string;
  name: string | null;
  employeeId: string | null;
  position: string | null;
  image: string | null;
  tasksCompleted: number;
  totalHours: number;
  qualityScore: number;
  baseEarnings: number;
  qualityBonus: number;
  totalEarnings: number;
  paymentStatus: string;
  paymentDate: Date | null;
  paymentMethod: string | null;
}

export type EmployeeTab = "team" | "payroll";

export interface EmployeeFilters {
  status?: "active" | "leave" | "temporary";
  department?: string;
  projectId?: string;
  searchQuery?: string;
}

export interface PayrollFilters {
  status?: string;
  payPeriod?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  searchQuery?: string;
}