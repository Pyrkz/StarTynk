import { PrismaClient } from '@repo/database';
import type { User } from '@repo/database';
import type { CreateUserDTO, UpdateUserDTO } from '@repo/shared';
import { BaseRepository } from '../base';
import type { FindManyOptions } from '../base';
import type { IUserRepository } from './user.repository.interface';
import { Logger } from '@repo/utils';
import { RepositoryError, NotFoundError, DuplicateError } from '../../errors';

export class UserRepository extends BaseRepository<User, CreateUserDTO, UpdateUserDTO> 
  implements IUserRepository {
  
  protected model = 'user';

  constructor(prisma: PrismaClient, logger?: Logger) {
    super(prisma, logger);
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      this.logger.debug(`Finding user by email: ${email}`);
      return await this.prisma.user.findUnique({
        where: { email }
      });
    } catch (error) {
      this.logger.error(`Error finding user by email: ${email}`, error);
      throw new RepositoryError('Failed to find user by email', error);
    }
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      this.logger.debug(`Finding user by phone: ${phone}`);
      return await this.prisma.user.findFirst({
        where: { phone }
      });
    } catch (error) {
      this.logger.error(`Error finding user by phone: ${phone}`, error);
      throw new RepositoryError('Failed to find user by phone', error);
    }
  }

  async findActiveUsers(options?: FindManyOptions): Promise<User[]> {
    return this.findMany({
      ...options,
      where: {
        ...options?.where,
        isActive: true,
        deletedAt: null
      }
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 }
        }
      });
      this.logger.info(`Updated last login for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error updating last login for user: ${userId}`, error);
      throw new RepositoryError('Failed to update last login', error);
    }
  }

  async findWithProjects(userId: string): Promise<User & { projects: any[] }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          coordinatedProjects: {
            where: { isActive: true, deletedAt: null },
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
            }
          },
          createdProjects: {
            where: { isActive: true, deletedAt: null },
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
            }
          },
          projectAssignments: {
            where: { 
              isActive: true,
              project: { isActive: true, deletedAt: null }
            },
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  startDate: true,
                  endDate: true,
                }
              }
            }
          }
        }
      });
      
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      // Combine all projects user is involved with
      const allProjects = [
        ...user.coordinatedProjects,
        ...user.createdProjects,
        ...user.projectAssignments.map(assignment => assignment.project)
      ];

      // Remove duplicates by id
      const uniqueProjects = allProjects.filter((project, index, self) =>
        index === self.findIndex(p => p.id === project.id)
      );

      return {
        ...user,
        projects: uniqueProjects
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      this.logger.error(`Error finding user with projects: ${userId}`, error);
      throw new RepositoryError('Failed to find user with projects', error);
    }
  }

  async findWithRelations(userId: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          inviterUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          vehicleAssignments: {
            where: { 
              isActive: true,
              endDate: null 
            },
            include: {
              vehicle: {
                select: {
                  id: true,
                  make: true,
                  model: true,
                  licensePlate: true
                }
              }
            }
          },
          equipmentAssignments: {
            where: { 
              isActive: true,
              returnDate: null 
            },
            include: {
              equipment: {
                select: {
                  id: true,
                  name: true,
                  serialNumber: true
                }
              }
            }
          },
          _count: {
            select: {
              coordinatedProjects: {
                where: { isActive: true, deletedAt: null }
              },
              createdProjects: {
                where: { isActive: true, deletedAt: null }
              },
              taskAssignments: {
                where: { 
                  isActive: true,
                  task: { isActive: true, deletedAt: null }
                }
              },
              vehicleAssignments: {
                where: { isActive: true }
              },
              equipmentAssignments: {
                where: { isActive: true }
              }
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error finding user with relations: ${userId}`, error);
      throw new RepositoryError('Failed to find user with relations', error);
    }
  }

  async bulkCreate(users: CreateUserDTO[]): Promise<User[]> {
    return this.executeInTransaction(async (tx) => {
      const createdUsers = [];
      for (const userData of users) {
        // Check for duplicates
        if (userData.email) {
          const existing = await tx.user.findUnique({
            where: { email: userData.email }
          });
          if (existing) {
            throw new DuplicateError('User', 'email', userData.email);
          }
        }

        if (userData.phone) {
          const existing = await tx.user.findFirst({
            where: { phone: userData.phone }
          });
          if (existing) {
            throw new DuplicateError('User', 'phone', userData.phone);
          }
        }

        // Convert string dates to Date objects for database
        const userData_converted = {
          ...userData,
          employmentStartDate: userData.employmentStartDate ? new Date(userData.employmentStartDate) : undefined,
          employmentEndDate: userData.employmentEndDate ? new Date(userData.employmentEndDate) : undefined
        };
        const user = await tx.user.create({ data: userData_converted });
        createdUsers.push(user);
      }
      return createdUsers;
    });
  }

  async findByRole(role: string, options?: FindManyOptions): Promise<User[]> {
    return this.findMany({
      ...options,
      where: {
        ...options?.where,
        role,
        isActive: true,
        deletedAt: null
      }
    });
  }

  async searchUsers(query: string, options?: FindManyOptions): Promise<User[]> {
    const searchCondition = this.buildSearchCondition(query, ['name', 'email', 'phone', 'position', 'department']);
    
    return this.findMany({
      ...options,
      where: {
        ...options?.where,
        ...searchCondition,
        isActive: true,
        deletedAt: null
      }
    });
  }

  async getUserStats(userId: string): Promise<{
    projectCount: number;
    taskCount: number;
    vehicleCount: number;
    equipmentCount: number;
  }> {
    try {
      const stats = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: {
            select: {
              coordinatedProjects: {
                where: { isActive: true, deletedAt: null }
              },
              createdProjects: {
                where: { isActive: true, deletedAt: null }
              },
              projectAssignments: {
                where: { 
                  isActive: true,
                  project: { isActive: true, deletedAt: null }
                }
              },
              taskAssignments: {
                where: { 
                  isActive: true,
                  task: { isActive: true, deletedAt: null }
                }
              },
              vehicleAssignments: {
                where: { isActive: true, endDate: null }
              },
              equipmentAssignments: {
                where: { isActive: true, returnDate: null }
              }
            }
          }
        }
      });

      if (!stats) {
        throw new NotFoundError('User', userId);
      }

      return {
        projectCount: stats._count.coordinatedProjects + 
                     stats._count.createdProjects + 
                     stats._count.projectAssignments,
        taskCount: stats._count.taskAssignments,
        vehicleCount: stats._count.vehicleAssignments,
        equipmentCount: stats._count.equipmentAssignments
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      this.logger.error(`Error getting user stats: ${userId}`, error);
      throw new RepositoryError('Failed to get user stats', error);
    }
  }

  async create(data: CreateUserDTO): Promise<User> {
    // Check for duplicates before creating
    if (data.email) {
      const existingByEmail = await this.findByEmail(data.email);
      if (existingByEmail) {
        throw new DuplicateError('User', 'email', data.email);
      }
    }

    if (data.phone) {
      const existingByPhone = await this.findByPhone(data.phone);
      if (existingByPhone) {
        throw new DuplicateError('User', 'phone', data.phone);
      }
    }

    // Convert string dates to Date objects for database
    const dataConverted = {
      ...data,
      employmentStartDate: data.employmentStartDate ? new Date(data.employmentStartDate) : undefined,
      employmentEndDate: data.employmentEndDate ? new Date(data.employmentEndDate) : undefined
    };
    return super.create(dataConverted as any);
  }

  async update(id: string, data: UpdateUserDTO): Promise<User> {
    // Check for duplicates if email or phone is being updated
    if (data.email) {
      const existingByEmail = await this.findByEmail(data.email);
      if (existingByEmail && existingByEmail.id !== id) {
        throw new DuplicateError('User', 'email', data.email);
      }
    }

    if (data.phone) {
      const existingByPhone = await this.findByPhone(data.phone);
      if (existingByPhone && existingByPhone.id !== id) {
        throw new DuplicateError('User', 'phone', data.phone);
      }
    }

    // Convert string dates to Date objects for database
    const dataConverted = {
      ...data,
      employmentStartDate: data.employmentStartDate ? new Date(data.employmentStartDate) : undefined,
      employmentEndDate: data.employmentEndDate ? new Date(data.employmentEndDate) : undefined
    };
    return super.update(id, dataConverted as any);
  }
}