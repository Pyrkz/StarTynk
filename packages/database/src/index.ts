export * from '@prisma/client';
export { prisma } from './client';
export type { Prisma } from '@prisma/client';

// Re-export useful Prisma utilities
export {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError
} from '@prisma/client/runtime/library';