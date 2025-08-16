// Core infrastructure
export * from './repositories';
export * from './services';
export * from './errors';
export * from './events';
export * from './transactions';

// Auth feature
export * from './auth';
export * from './auth/hooks';
export * from './auth/store/auth.store';

// Users feature
export * from './users';

// Projects feature
export * from './projects';

// Shared utilities and hooks
export * from './shared';
export * from './shared/hooks/useApiQuery';

// Platform-specific exports (conditional)
export * from './auth/hooks/web/useWebAuth';
export * from './auth/hooks/mobile/useMobileAuth';

// Re-export types and utilities
export type { FindManyOptions, PaginationOptions, SearchOptions } from './repositories/base';
export type { EventName, EventPayload } from './events';
export type { TransactionOptions } from './transactions';