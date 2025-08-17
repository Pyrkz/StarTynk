import { PrismaClient } from '@prisma/client';

// Create a singleton instance of Prisma Client
class Database {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!Database.instance) {
      Database.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
    return Database.instance;
  }

  static async connect(): Promise<void> {
    try {
      await Database.getInstance().$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      process.exit(1);
    }
  }

  static async disconnect(): Promise<void> {
    await Database.getInstance().$disconnect();
  }
}

export const prisma = Database.getInstance();
export { Database };