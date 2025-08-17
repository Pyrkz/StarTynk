import { PrismaClient, Prisma } from '@repo/database';
import { Logger } from '@repo/utils';
import { BusinessError } from '../errors';

export interface TransactionOptions {
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

export class TransactionManager {
  private logger: Logger;

  constructor(
    private readonly prisma: PrismaClient,
    logger?: Logger
  ) {
    this.logger = logger || new Logger('TransactionManager');
  }

  /**
   * Execute multiple operations in a single transaction
   */
  async execute<T>(
    operations: (tx: Prisma.TransactionClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Starting transaction', options);
      
      const result = await this.prisma.$transaction(operations, {
        timeout: options.timeout || 30000, // 30 seconds default
        isolationLevel: options.isolationLevel
      });
      
      const duration = Date.now() - startTime;
      this.logger.info('Transaction completed successfully', { duration });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Transaction failed', error, { duration });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors
        switch (error.code) {
          case 'P2002':
            throw new BusinessError('Unique constraint violation', error);
          case 'P2025':
            throw new BusinessError('Record not found', error);
          case 'P2034':
            throw new BusinessError('Transaction conflict', error);
          default:
            throw new BusinessError('Database transaction failed', error);
        }
      }
      
      throw new BusinessError('Transaction execution failed', error);
    }
  }

  /**
   * Execute operations with retry logic for transaction conflicts
   */
  async executeWithRetry<T>(
    operations: (tx: Prisma.TransactionClient) => Promise<T>,
    options: TransactionOptions & { maxRetries?: number } = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries || 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.execute(operations, options);
      } catch (error) {
        lastError = error as Error;
        
        // Only retry on transaction conflicts
        if (error instanceof BusinessError && 
            error.originalError instanceof Prisma.PrismaClientKnownRequestError &&
            error.originalError.code === 'P2034') {
          
          this.logger.warn(`Transaction conflict on attempt ${attempt}/${maxRetries}, retrying...`);
          
          if (attempt < maxRetries) {
            // Exponential backoff with jitter
            const delay = Math.random() * (Math.pow(2, attempt - 1) * 100);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // Don't retry for other errors
        break;
      }
    }

    throw lastError!;
  }

  /**
   * Execute multiple independent operations in parallel within a transaction
   * Note: This is mainly for read operations as writes can cause conflicts
   */
  async executeParallel<T extends readonly unknown[]>(
    operations: readonly [...{ [K in keyof T]: (tx: Prisma.TransactionClient) => Promise<T[K]> }],
    options: TransactionOptions = {}
  ): Promise<T> {
    return this.execute(async (tx) => {
      const promises = operations.map(operation => operation(tx));
      const results = await Promise.all(promises);
      return results as unknown as T;
    }, options);
  }

  /**
   * Create a savepoint within a transaction (for advanced use cases)
   */
  async withSavepoint<T>(
    tx: Prisma.TransactionClient,
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      // Create savepoint
      await tx.$executeRaw`SAVEPOINT ${Prisma.raw(name)}`;
      
      const result = await operation();
      
      // Release savepoint
      await tx.$executeRaw`RELEASE SAVEPOINT ${Prisma.raw(name)}`;
      
      return result;
    } catch (error) {
      // Rollback to savepoint
      await tx.$executeRaw`ROLLBACK TO SAVEPOINT ${Prisma.raw(name)}`;
      throw error;
    }
  }

  /**
   * Utility to check if we're currently in a transaction context
   */
  static isInTransaction(client: PrismaClient | Prisma.TransactionClient): boolean {
    return '$transaction' in client && typeof client.$transaction === 'function';
  }
}