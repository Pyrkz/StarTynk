// Mock payroll data
export const mockPayrollRecords = [
  {
    id: 'pay1',
    projectId: '1',
    userId: 'emp1',
    period: '2024-01',
    hoursWorked: 168,
    hourlyRate: 45,
    regularPay: 7560,
    overtimeHours: 0,
    overtimePay: 0,
    bonuses: 500,
    deductions: 0,
    totalGross: 8060,
    taxDeducted: 1451,
    totalNet: 6609,
    status: 'PAID',
    paidAt: new Date('2024-02-05'),
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05'),
    user: {
      id: 'emp1',
      name: 'Piotr Nowak',
      position: 'Tynkarz',
      department: 'Wykonawstwo',
      taskAssignments: []
    }
  },
  {
    id: 'pay2',
    projectId: '1',
    userId: 'emp2',
    period: '2024-01',
    hoursWorked: 176,
    hourlyRate: 45,
    regularPay: 7920,
    overtimeHours: 8,
    overtimePay: 540,
    bonuses: 300,
    deductions: 0,
    totalGross: 8760,
    taxDeducted: 1577,
    totalNet: 7183,
    status: 'PAID',
    paidAt: new Date('2024-02-05'),
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05'),
    user: {
      id: 'emp2',
      name: 'Tomasz Wiśniewski',
      position: 'Tynkarz',
      department: 'Wykonawstwo',
      taskAssignments: []
    }
  },
  {
    id: 'pay3',
    projectId: '1',
    userId: 'emp3',
    period: '2024-01',
    hoursWorked: 168,
    hourlyRate: 65,
    regularPay: 10920,
    overtimeHours: 0,
    overtimePay: 0,
    bonuses: 1000,
    deductions: 0,
    totalGross: 11920,
    taxDeducted: 2146,
    totalNet: 9774,
    status: 'PAID',
    paidAt: new Date('2024-02-05'),
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05'),
    user: {
      id: 'emp3',
      name: 'Marek Kowalczyk',
      position: 'Kierownik zespołu',
      department: 'Wykonawstwo',
      taskAssignments: []
    }
  },
  // February records
  {
    id: 'pay4',
    projectId: '1',
    userId: 'emp1',
    period: '2024-02',
    hoursWorked: 160,
    hourlyRate: 45,
    regularPay: 7200,
    overtimeHours: 0,
    overtimePay: 0,
    bonuses: 0,
    deductions: 0,
    totalGross: 7200,
    taxDeducted: 1296,
    totalNet: 5904,
    status: 'PENDING',
    paidAt: null,
    isActive: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    user: {
      id: 'emp1',
      name: 'Piotr Nowak',
      position: 'Tynkarz',
      department: 'Wykonawstwo',
      taskAssignments: []
    }
  }
]

export function getMockPayrollByProject(projectId: string, period?: string | null) {
  let records = mockPayrollRecords.filter(r => r.projectId === projectId)
  
  if (period) {
    records = records.filter(r => r.period === period)
  }
  
  return records
}