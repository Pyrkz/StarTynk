// Mock employees data
export const mockEmployees = [
  {
    id: 'emp1',
    name: 'Piotr Nowak',
    position: 'Tynkarz',
    department: 'Wykonawstwo',
    email: 'p.nowak@example.com',
    phone: '+48 123 456 789',
    status: 'active' as const,
    joinedDate: new Date('2024-01-15'),
    tasksAssigned: 15,
    tasksCompleted: 8,
    equipmentAssigned: [
      {
        id: 'eq1',
        name: 'Agregat tynkarski',
        type: 'tool' as const,
        serialNumber: 'AT-2024-001',
        condition: 'good' as const,
        assignedDate: new Date('2024-01-20')
      }
    ],
    currentApartments: ['A101', 'A102', 'A103'],
    role: 'Pracownik',
    hourlyRate: 45,
    employmentType: 'FULL_TIME'
  },
  {
    id: 'emp2',
    name: 'Tomasz Wiśniewski',
    position: 'Tynkarz',
    department: 'Wykonawstwo',
    email: 't.wisniewski@example.com',
    phone: '+48 987 654 321',
    status: 'active' as const,
    joinedDate: new Date('2024-01-20'),
    tasksAssigned: 12,
    tasksCompleted: 10,
    equipmentAssigned: [
      {
        id: 'eq2',
        name: 'Mieszarka',
        type: 'tool' as const,
        serialNumber: 'M-2024-002',
        condition: 'excellent' as const,
        assignedDate: new Date('2024-01-25')
      }
    ],
    currentApartments: ['A201', 'A202'],
    role: 'Pracownik',
    hourlyRate: 45,
    employmentType: 'FULL_TIME'
  },
  {
    id: 'emp3',
    name: 'Marek Kowalczyk',
    position: 'Kierownik zespołu',
    department: 'Wykonawstwo',
    email: 'm.kowalczyk@example.com',
    phone: '+48 555 123 456',
    status: 'active' as const,
    joinedDate: new Date('2024-01-10'),
    tasksAssigned: 20,
    tasksCompleted: 18,
    equipmentAssigned: [],
    currentApartments: ['A101', 'A102', 'A201', 'A202'],
    role: 'Kierownik',
    hourlyRate: 65,
    employmentType: 'FULL_TIME'
  }
]