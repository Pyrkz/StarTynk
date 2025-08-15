export interface ApiResponseDTO<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorDTO;
  meta?: MetaDTO;
  timestamp: string;
  version: string;
}

export interface ErrorDTO {
  message: string;
  code: string;
  details?: any;
  stack?: string;
  field?: string;
  statusCode?: number;
}

export interface MetaDTO {
  requestId?: string;
  duration?: number;
  correlationId?: string;
  [key: string]: any;
}

export interface ValidationErrorDTO {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface BatchResponseDTO<T> {
  success: T[];
  failed: Array<{
    item: any;
    error: ErrorDTO;
  }>;
  total: number;
  successCount: number;
  failedCount: number;
}

export interface HealthCheckDTO {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    database: boolean;
    redis?: boolean;
    storage?: boolean;
    [key: string]: boolean | undefined;
  };
  uptime: number;
}