import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create PrismaClient with proper configuration
const createPrismaClient = () => {
  const options: any = {
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  }
  
  // Add datasourceUrl for Prisma 5.x compatibility
  if (process.env.DATABASE_URL) {
    options.datasourceUrl = process.env.DATABASE_URL
  }
  
  return new PrismaClient(options)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}