import { PrismaClient, Prisma } from '@repo/database';
import { Logger } from '@repo/utils/logger';
import { RepositoryError, NotFoundError, DuplicateError } from '../../errors';
import { IRepository, FindManyOptions } from './repository.interface';

export abstract class BaseRepository<T, CreateDTO, UpdateDTO> 
  implements IRepository<T, CreateDTO, UpdateDTO> {
  
  protected abstract model: string;
  protected logger: Logger;
  
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly loggerInstance?: Logger
  ) {
    this.logger = loggerInstance || new Logger(this.constructor.name);
  }

  async findById(id: string): Promise<T | null> {
    try {
      this.logger.debug(`Finding ${this.model} by id: ${id}`);
      const result = await (this.prisma as any)[this.model].findUnique({
        where: { id }
      });
      return result;
    } catch (error) {
      this.logger.error(`Error finding ${this.model} by id: ${id}`, error);
      throw new RepositoryError(`Failed to find ${this.model}`, error);
    }
  }

  async findMany(options: FindManyOptions = {}): Promise<T[]> {
    try {
      this.logger.debug(`Finding multiple ${this.model}`, options);
      const results = await (this.prisma as any)[this.model].findMany(options);
      return results;
    } catch (error) {
      this.logger.error(`Error finding multiple ${this.model}`, error);
      throw new RepositoryError(`Failed to find ${this.model} records`, error);
    }
  }

  async create(data: CreateDTO): Promise<T> {
    try {
      this.logger.debug(`Creating ${this.model}`, data);
      const result = await (this.prisma as any)[this.model].create({
        data
      });
      this.logger.info(`Created ${this.model} with id: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error creating ${this.model}`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new DuplicateError(this.model, 'unique field', 'value');
        }
      }
      throw new RepositoryError(`Failed to create ${this.model}`, error);
    }
  }

  async update(id: string, data: UpdateDTO): Promise<T> {
    try {
      this.logger.debug(`Updating ${this.model} with id: ${id}`, data);
      const result = await (this.prisma as any)[this.model].update({
        where: { id },
        data
      });
      this.logger.info(`Updated ${this.model} with id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error updating ${this.model} with id: ${id}`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundError(this.model, id);
        }
      }
      throw new RepositoryError(`Failed to update ${this.model}`, error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      this.logger.debug(`Deleting ${this.model} with id: ${id}`);
      await (this.prisma as any)[this.model].delete({
        where: { id }
      });
      this.logger.info(`Deleted ${this.model} with id: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting ${this.model} with id: ${id}`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundError(this.model, id);
        }
      }
      throw new RepositoryError(`Failed to delete ${this.model}`, error);
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      this.logger.debug(`Soft deleting ${this.model} with id: ${id}`);
      await (this.prisma as any)[this.model].update({
        where: { id },
        data: { 
          deletedAt: new Date(),
          isActive: false 
        }
      });
      this.logger.info(`Soft deleted ${this.model} with id: ${id}`);
    } catch (error) {
      this.logger.error(`Error soft deleting ${this.model} with id: ${id}`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundError(this.model, id);
        }
      }
      throw new RepositoryError(`Failed to soft delete ${this.model}`, error);
    }
  }

  async count(where?: any): Promise<number> {
    try {
      const count = await (this.prisma as any)[this.model].count({ where });
      return count;
    } catch (error) {
      this.logger.error(`Error counting ${this.model}`, error);
      throw new RepositoryError(`Failed to count ${this.model}`, error);
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.count({ id });
    return count > 0;
  }

  // Transaction helper
  protected async executeInTransaction<R>(
    callback: (tx: Prisma.TransactionClient) => Promise<R>
  ): Promise<R> {
    return this.prisma.$transaction(callback);
  }

  // Batch operations helper
  protected async batchCreate(items: CreateDTO[]): Promise<T[]> {
    return this.executeInTransaction(async (tx) => {
      const createdItems = [];
      for (const item of items) {
        const created = await (tx as any)[this.model].create({ data: item });
        createdItems.push(created);
      }
      return createdItems;
    });
  }

  // Helper for building where conditions
  protected buildWhereCondition(filters: Record<string, any>): any {
    const where: any = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        where[key] = value;
      }
    });

    // Always filter out soft deleted records by default
    if (!where.deletedAt) {
      where.deletedAt = null;
    }

    return where;
  }

  // Helper for search functionality
  protected buildSearchCondition(search: string, searchFields: string[]): any {
    if (!search || !searchFields.length) return {};

    return {
      OR: searchFields.map(field => ({
        [field]: {
          contains: search,
          mode: 'insensitive'
        }
      }))
    };
  }
}