export * from './api-error';
export * from './auth-error';
export * from './not-found-error';

// Re-export ValidationError from validation package to avoid conflicts
export { ValidationError } from '@repo/validation/errors';