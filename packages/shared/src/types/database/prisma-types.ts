/**
 * Temporary database types for compilation
 * These should match the Prisma generated types from @repo/database
 */

export interface Project {
  id: string;
  name: string;
  address: string;
  developerId: string;
  startDate: Date;
  endDate: Date;
  baseRate: any; // Decimal
  status: string;
  description: string | null;
  coordinatorId: string | null;
  createdById: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  developer?: Developer;
  coordinator?: any;
  createdBy?: any;
  apartments?: Apartment[];
  tasks?: Task[];
  _count?: any;
}

export interface Task {
  id: string;
  projectId: string;
  apartmentId: string | null;
  title: string;
  description: string | null;
  area: any; // Decimal
  rate: any; // Decimal
  status: string;
  priority: string;
  estimatedHours: number | null;
  actualHours: number | null;
  dueDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  apartment?: Apartment;
  assignments?: any[];
  _count?: any;
}

export interface Apartment {
  id: string;
  projectId: string;
  number: string;
  floor: number | null;
  area: any | null; // Decimal
  rooms: number | null;
  type: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QualityControl {
  id: string;
  taskId: string;
  controllerId: string;
  controlNumber: string;
  status: string;
  completionRate: number;
  notes: string | null;
  issuesFound: number | null;
  correctionsNeeded: number | null;
  controlDate: Date;
  recontrolDate: Date | null;
  issueType: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  controller?: any;
}

export interface Developer {
  id: string;
  name: string;
  address: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  passwordHash: string | null;
  name: string | null;
  companyName: string | null;
  role: string;
  image: string | null;
  position: string | null;
  department: string | null;
  loginCount: number;
  invitedBy: string | null;
  employmentStartDate: Date | null;
  employmentEndDate: Date | null;
  isActive: boolean;
  emailVerified: Date | null;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  inviter?: User | null;
  coordinator?: User | null;
  vehicleAssignments?: any[];
  equipmentAssignments?: any[];
  _count?: any;
}

// Prisma types
export namespace Prisma {
  export interface ProjectCreateInput {
    name: string;
    address: string;
    developer: { connect: { id: string } };
    startDate: Date;
    endDate: Date;
    baseRate: number;
    status: string;
    description?: string | null;
    coordinator?: { connect: { id: string } } | undefined;
    createdBy: { connect: { id: string } };
  }

  export interface ProjectUpdateInput {
    name?: string;
    address?: string;
    developer?: { connect: { id: string } };
    startDate?: Date;
    endDate?: Date;
    baseRate?: number;
    status?: string;
    description?: string | null;
    coordinator?: { connect: { id: string } } | { disconnect: true };
    isActive?: boolean;
  }

  export interface TaskCreateInput {
    title: string;
    description?: string | null;
    area: number;
    rate: number;
    status: string;
    priority: string;
    estimatedHours?: number | null;
    dueDate?: Date;
    project: { connect: { id: string } };
    apartment?: { connect: { id: string } };
  }

  export interface ApartmentCreateInput {
    number: string;
    floor?: number | null;
    area?: number | null;
    rooms?: number | null;
    type?: string | null;
    project: { connect: { id: string } };
  }

  export interface QualityControlCreateInput {
    task: { connect: { id: string } };
    controller: { connect: { id: string } };
    status: string;
    completionRate: number;
    notes?: string | null;
    issuesFound?: number | null;
    correctionsNeeded?: number | null;
    recontrolDate?: Date;
    issueType?: string | null;
  }

  export interface DeveloperCreateInput {
    name: string;
    address?: string | null;
    contact?: string | null;
    email?: string | null;
    phone?: string | null;
  }

  export interface UserCreateInput {
    email?: string | null;
    phone?: string | null;
    password?: string;
    passwordHash?: string | null;
    name?: string | null;
    companyName?: string | null;
    role: string;
    position?: string | null;
    department?: string | null;
    employmentStartDate?: Date | null;
  }

  export interface UserUpdateInput {
    email?: string | null;
    phone?: string | null;
    name?: string | null;
    companyName?: string | null;
    role?: string;
    image?: string | null;
    position?: string | null;
    department?: string | null;
    isActive?: boolean;
  }
}