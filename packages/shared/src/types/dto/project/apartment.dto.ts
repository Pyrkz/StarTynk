export interface ApartmentDTO {
  id: string;
  projectId: string;
  number: string;
  floor?: number | null;
  area?: number | null;
  rooms?: number | null;
  type?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks?: number;
  };
}

export interface CreateApartmentDTO {
  projectId: string;
  number: string;
  floor?: number;
  area?: number;
  rooms?: number;
  type?: string;
}

export interface UpdateApartmentDTO {
  number?: string;
  floor?: number | null;
  area?: number | null;
  rooms?: number | null;
  type?: string | null;
  isActive?: boolean;
}

export interface BulkCreateApartmentsDTO {
  projectId: string;
  apartments: Omit<CreateApartmentDTO, 'projectId'>[];
}