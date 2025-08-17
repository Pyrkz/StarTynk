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

// Import PaginationMeta from api-response to avoid duplication
import type { PaginationMeta } from '../responses/api-response';

export interface ListResponse<T> extends SuccessResponseData<T[]> {
  meta: PaginationMeta;
}

export type ApiResponseData<T> = SuccessResponseData<T> | ErrorResponseData;