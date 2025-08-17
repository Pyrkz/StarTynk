import { User } from '@repo/database';
import { CreateUserDTO, UpdateUserDTO } from '@repo/shared';
import { IRepository, FindManyOptions } from '../base';

export interface IUserRepository extends IRepository<User, CreateUserDTO, UpdateUserDTO> {
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findActiveUsers(options?: FindManyOptions): Promise<User[]>;
  updateLastLogin(userId: string): Promise<void>;
  findWithProjects(userId: string): Promise<User & { projects: any[] }>;
  findWithRelations(userId: string): Promise<User | null>;
  bulkCreate(users: CreateUserDTO[]): Promise<User[]>;
  findByRole(role: string, options?: FindManyOptions): Promise<User[]>;
  searchUsers(query: string, options?: FindManyOptions): Promise<User[]>;
  getUserStats(userId: string): Promise<{
    projectCount: number;
    taskCount: number;
    vehicleCount: number;
    equipmentCount: number;
  }>;
}