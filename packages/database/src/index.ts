// Export database client
export { prisma } from './client';

// Export generated types and enums
export * from './types';

// Re-export useful Prisma utilities
export {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError
} from '@prisma/client/runtime/library';