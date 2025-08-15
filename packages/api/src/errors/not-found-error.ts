import { ApiError } from './api-error';

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} not found`, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super(
      'User',
      identifier ? { identifier } : undefined
    );
    this.name = 'UserNotFoundError';
  }
}

export class ProjectNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super(
      'Project',
      id ? { projectId: id } : undefined
    );
    this.name = 'ProjectNotFoundError';
  }
}