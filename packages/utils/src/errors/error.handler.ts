import { Logger } from '../logger';

export interface ErrorHandlerOptions {
  logger?: Logger;
  includeStack?: boolean;
  notifyService?: (error: Error) => void;
}

export class ErrorHandler {
  private logger: Logger;
  private options: ErrorHandlerOptions;

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = options;
    this.logger = options.logger || new Logger('ErrorHandler');
  }

  handle(error: unknown, context?: string): void {
    const errorInfo = this.extractErrorInfo(error);
    
    this.logger.error(
      `Error in ${context || 'unknown context'}`,
      error,
      errorInfo
    );

    // Notify external service in production
    if (process.env.NODE_ENV === 'production' && this.options.notifyService) {
      this.options.notifyService(errorInfo as Error);
    }
  }

  extractErrorInfo(error: unknown): Record<string, any> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: this.options.includeStack ? error.stack : undefined,
        ...this.extractAdditionalInfo(error)
      };
    }

    if (typeof error === 'string') {
      return { message: error };
    }

    if (typeof error === 'object' && error !== null) {
      return { ...error };
    }

    return { message: String(error) };
  }

  private extractAdditionalInfo(error: Error): Record<string, any> {
    const info: Record<string, any> = {};
    
    // Extract custom properties
    for (const key in error) {
      if (!['name', 'message', 'stack'].includes(key)) {
        info[key] = (error as any)[key];
      }
    }
    
    return info;
  }

  isOperationalError(error: Error): boolean {
    // Determine if error is operational (expected) vs programmer error
    return (error as any).isOperational === true;
  }

  async handleAsync<T>(
    promise: Promise<T>,
    context?: string
  ): Promise<[T, null] | [null, Error]> {
    try {
      const result = await promise;
      return [result, null];
    } catch (error) {
      this.handle(error, context);
      return [null, error as Error];
    }
  }
}

// Global error handler instance
let globalErrorHandler: ErrorHandler | null = null;

/**
 * Get or create the global error handler
 */
export function getErrorHandler(): ErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new ErrorHandler();
  }
  return globalErrorHandler;
}

/**
 * Set a custom global error handler
 */
export function setErrorHandler(errorHandler: ErrorHandler): void {
  globalErrorHandler = errorHandler;
}