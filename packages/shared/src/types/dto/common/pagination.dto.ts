import { FilterOperator, SortOrder } from '../../enums';

export interface PaginationDTO {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationDTO;
}

export interface SortDTO {
  field: string;
  order: SortOrder;
}

export interface FilterDTO {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface QueryOptionsDTO {
  pagination?: PaginationDTO;
  sort?: SortDTO[];
  filters?: FilterDTO[];
}

export interface PaginationRequestDTO {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  filters?: Record<string, any>;
}