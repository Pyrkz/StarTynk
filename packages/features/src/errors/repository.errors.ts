export class RepositoryError extends Error {
  public readonly code: string;
  public readonly originalError?: Error;

  constructor(message: string, originalError?: unknown, code = 'REPOSITORY_ERROR') {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
    this.originalError = originalError instanceof Error ? originalError : undefined;

    // Maintains proper stack trace for where our error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RepositoryError);
    }
  }
}

export class NotFoundError extends RepositoryError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, undefined, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class DuplicateError extends RepositoryError {
  constructor(resource: string, field: string, value: string) {
    super(`${resource} with ${field} '${value}' already exists`, undefined, 'DUPLICATE');
    this.name = 'DuplicateError';
  }
}

export class ValidationError extends RepositoryError {
  constructor(message: string, originalError?: unknown) {
    super(message, originalError, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ConnectionError extends RepositoryError {
  constructor(message: string, originalError?: unknown) {
    super(message, originalError, 'CONNECTION_ERROR');
    this.name = 'ConnectionError';
  }
}