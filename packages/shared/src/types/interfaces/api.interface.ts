import { FilterOperator, SortOrder } from '../enums';

export interface ApiRequest {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode?: number;
  field?: string;
  details?: any;
}

export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  duration?: number;
  version?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface FilterParams {
  filters?: Record<string, any>;
  search?: string;
}

export interface QueryParams extends PaginationParams, SortParams, FilterParams {
  include?: string[];
  exclude?: string[];
}

export interface BatchOperation<T> {
  items: T[];
  options?: {
    stopOnError?: boolean;
    parallel?: boolean;
    batchSize?: number;
  };
}

export interface BatchResult<T, E = any> {
  successful: T[];
  failed: Array<{ item: any; error: E }>;
  total: number;
  successCount: number;
  failedCount: number;
}