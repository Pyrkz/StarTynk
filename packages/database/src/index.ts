// Export database client
export { prisma } from './client';

// Export generated types and enums
export * from './types';

// Re-export Prisma namespace for server-side use
export { Prisma } from '@prisma/client';

// Export Decimal from runtime library
export { Decimal } from '@prisma/client/runtime/library';

// Re-export useful Prisma utilities
export {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError
} from '@prisma/client/runtime/library';