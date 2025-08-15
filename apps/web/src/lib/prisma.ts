import { PrismaClient } from '@prisma/client'

// Skip Prisma initialization during build if no DATABASE_URL
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a dummy client during build time if DATABASE_URL is not set
function createPrismaClient() {
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    console.warn('DATABASE_URL not set during build, using dummy Prisma client')
    // Return a proxy that will throw error if actually used
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error('Cannot use Prisma client without DATABASE_URL')
      }
    })
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma