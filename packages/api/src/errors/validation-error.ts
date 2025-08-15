import { ApiError } from './api-error';
import { ZodError } from 'zod';

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', errors?: any) {
    super(message, 'VALIDATION_ERROR', 422, errors);
    this.name = 'ValidationError';
  }

  static fromZodError(zodError: ZodError): ValidationError {
    const formattedErrors = zodError.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code
    }));

    return new ValidationError('Validation failed', formattedErrors);
  }
}