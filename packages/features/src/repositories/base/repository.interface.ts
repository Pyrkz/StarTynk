export interface IRepository<T, CreateDTO, UpdateDTO> {
  findById(id: string): Promise<T | null>;
  findMany(options?: FindManyOptions): Promise<T[]>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  count(where?: any): Promise<number>;
  exists(id: string): Promise<boolean>;
}

export interface FindManyOptions {
  where?: any;
  orderBy?: any;
  skip?: number;
  take?: number;
  include?: any;
}

export interface PaginationOptions extends FindManyOptions {
  page?: number;
  limit?: number;
}

export interface SearchOptions extends FindManyOptions {
  search?: string;
  searchFields?: string[];
}