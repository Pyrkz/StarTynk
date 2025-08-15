export interface SuccessResponseData<T> {
  success: true;
  data: T;
  meta?: any;
  timestamp: string;
}

export interface ErrorResponseData {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
    timestamp: string;
  };
}

export interface PaginationMeta {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ListResponse<T> extends SuccessResponseData<T[]> {
  meta: PaginationMeta;
}

export type ApiResponseData<T> = SuccessResponseData<T> | ErrorResponseData;