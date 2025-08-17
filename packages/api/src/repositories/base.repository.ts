import { PrismaClient } from '@repo/database';
import type { PaginationParams } from '../utils/pagination';
import { calculatePagination } from '../utils/pagination';

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;
  protected model: any;

  constructor(prisma: PrismaClient, model: any) {
    this.prisma = prisma;
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findMany(params: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    include?: any;
    select?: any;
  }): Promise<T[]> {
    return this.model.findMany(params);
  }

  async findManyWithPagination(
    params: {
      where?: any;
      orderBy?: any;
      include?: any;
      select?: any;
    },
    pagination: PaginationParams
  ): Promise<{ data: T[]; total: number }> {
    const { skip, take } = calculatePagination(pagination);
    
    const [data, total] = await Promise.all([
      this.model.findMany({
        ...params,
        skip,
        take,
        orderBy: pagination.sortBy
          ? { [pagination.sortBy]: pagination.sortOrder || 'desc' }
          : params.orderBy,
      }),
      this.model.count({ where: params.where }),
    ]);

    return { data, total };
  }

  async findFirst(params: {
    where?: any;
    orderBy?: any;
    include?: any;
    select?: any;
  }): Promise<T | null> {
    return this.model.findFirst(params);
  }

  async create(data: any, include?: any): Promise<T> {
    return this.model.create({ data, include });
  }

  async createMany(data: any[]): Promise<{ count: number }> {
    return this.model.createMany({ data });
  }

  async update(id: string, data: any, include?: any): Promise<T> {
    return this.model.update({ 
      where: { id }, 
      data,
      include 
    });
  }

  async upsert(params: {
    where: any;
    create: any;
    update: any;
    include?: any;
  }): Promise<T> {
    return this.model.upsert(params);
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }

  async deleteMany(where: any): Promise<{ count: number }> {
    return this.model.deleteMany({ where });
  }

  async count(where?: any): Promise<number> {
    return this.model.count({ where });
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  async transaction<R>(fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<R>): Promise<R> {
    return this.prisma.$transaction(fn);
  }
}