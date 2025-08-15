import { Role } from '../../enums';

export interface UserDTO {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  role: Role;
  image?: string | null;
  position?: string | null;
  department?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserListItemDTO {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string | null;
  position?: string | null;
  department?: string | null;
}

export interface UserProfileDTO extends UserDTO {
  loginCount: number;
  invitedBy?: string | null;
  employmentStartDate?: string | null;
  employmentEndDate?: string | null;
  _count?: {
    projects?: number;
    tasks?: number;
    vehicles?: number;
    equipmentAssignments?: number;
  };
}

export interface UserWithRelationsDTO extends UserProfileDTO {
  coordinator?: {
    id: string;
    name: string | null;
  };
  inviter?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  currentVehicles?: Array<{
    id: string;
    make: string;
    model: string;
    licensePlate: string;
  }>;
  currentEquipment?: Array<{
    id: string;
    name: string;
    serialNumber?: string | null;
  }>;
}

export interface UserSessionDTO {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
  name?: string | null;
  image?: string | null;
  isActive: boolean;
}