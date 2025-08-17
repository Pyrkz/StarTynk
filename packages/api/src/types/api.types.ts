import type { ApiSuccessResponse, ApiErrorResponse } from '../responses';

export type ApiResult<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface RequestContext {
  requestId: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface HandlerResponse<T = any> {
  data?: T;
  meta?: any;
  status?: number;
  headers?: Record<string, string>;
}

export type HandlerFunction<TInput = any, TOutput = any> = (
  input: TInput,
  context: RequestContext
) => Promise<HandlerResponse<TOutput>>;

export interface PaginatedInput {
  page: number;
  limit: number;
}

// Import from validators to avoid duplication
export type { SearchInput, SortInput } from '../validators/common.validators';