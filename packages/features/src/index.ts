// Core infrastructure
export * from './repositories';
export * from './services';
export * from './errors';
export * from './events';
export * from './transactions';

// Auth feature
export * from './auth';

// Users feature
export * from './users';

// Projects feature
export * from './projects';

// Shared utilities and hooks
export * from './shared';

// Re-export types and utilities
export type { FindManyOptions, PaginationOptions, SearchOptions } from './repositories/base';
export type { EventName, EventPayload } from './events';
export type { TransactionOptions } from './transactions';