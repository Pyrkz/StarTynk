interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: any;
  timestamp: string;
}

interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
    timestamp: string;
  };
}

interface PaginationMeta {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ApiResponse {
  static success<T>(data: T, meta?: any): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString()
    };
  }

  static error(message: string, code: string = 'UNKNOWN_ERROR', details?: any): ApiErrorResponse {
    return {
      success: false,
      error: {
        message,
        code,
        details,
        timestamp: new Date().toISOString()
      }
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): ApiSuccessResponse<T[]> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      } as PaginationMeta,
      timestamp: new Date().toISOString()
    };
  }

  static created<T>(data: T): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static noContent(): { success: true; timestamp: string } {
    return {
      success: true,
      timestamp: new Date().toISOString()
    };
  }
}

export type { ApiSuccessResponse, ApiErrorResponse, PaginationMeta };