import type { User } from '@repo/database';
import type { UserDTO, CreateUserDTO, UpdateUserDTO } from '@repo/shared';
import { UserMapper } from '@repo/shared';
import { createUserSchema, updateUserSchema } from '@repo/validation';
import { Logger } from '@repo/utils';
import { hash, compare } from '@repo/utils';
import { UserRepository } from '../../repositories/user';
import { BusinessError, UnauthorizedError, ConflictError } from '../../errors';
import { EventBus } from '../../events';
import { TransactionManager } from '../../transactions';

export interface IUserService {
  findById(id: string): Promise<UserDTO | null>;
  findByEmail(email: string): Promise<UserDTO | null>;
  create(data: CreateUserDTO): Promise<UserDTO>;
  update(id: string, data: UpdateUserDTO): Promise<UserDTO>;
  delete(id: string): Promise<void>;
  authenticate(email: string, password: string): Promise<UserDTO>;
  findMany(options?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{ users: UserDTO[]; total: number; }>;
  getUserWithStats(id: string): Promise<UserDTO & { stats: any } | null>;
  bulkCreate(users: CreateUserDTO[]): Promise<UserDTO[]>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}

export class UserService implements IUserService {
  private logger: Logger;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
    private readonly transactionManager: TransactionManager,
    logger?: Logger
  ) {
    this.logger = logger || new Logger('UserService');
  }

  async findById(id: string): Promise<UserDTO | null> {
    try {
      this.logger.debug(`Finding user by id: ${id}`);
      const user = await this.userRepository.findById(id);
      return user ? UserMapper.toDTO(user) : null;
    } catch (error) {
      this.logger.error(`Error finding user by id: ${id}`, error);
      throw new BusinessError('Failed to find user', error);
    }
  }

  async findByEmail(email: string): Promise<UserDTO | null> {
    try {
      this.logger.debug(`Finding user by email: ${email}`);
      const user = await this.userRepository.findByEmail(email);
      return user ? UserMapper.toDTO(user) : null;
    } catch (error) {
      this.logger.error(`Error finding user by email: ${email}`, error);
      throw new BusinessError('Failed to find user', error);
    }
  }

  async create(data: CreateUserDTO): Promise<UserDTO> {
    try {
      // Validate input
      const validated = await createUserSchema.parseAsync(data);
      
      // Check if user already exists
      if (validated.email) {
        const existing = await this.userRepository.findByEmail(validated.email);
        if (existing) {
          throw new ConflictError('User with this email already exists');
        }
      }

      if (validated.phone) {
        const existing = await this.userRepository.findByPhone(validated.phone);
        if (existing) {
          throw new ConflictError('User with this phone number already exists');
        }
      }

      // Hash password
      const hashedPassword = await hash(validated.password);
      
      // Create user
      const createData: any = {
        ...validated,
        password: hashedPassword
      };
      
      // Convert string date to Date for database if it exists
      if (validated.employmentStartDate) {
        createData.employmentStartDate = new Date(validated.employmentStartDate);
      }
      
      const user = await this.userRepository.create(createData);

      // Emit event
      await this.eventBus.emit('user.created', {
        userId: user.id,
        email: user.email || '',
        role: user.role,
        timestamp: new Date()
      });

      this.logger.info(`User created successfully: ${user.id}`);
      return UserMapper.toDTO(user);
    } catch (error) {
      this.logger.error('Error creating user', error);
      throw error instanceof BusinessError ? error : new BusinessError('Failed to create user', error);
    }
  }

  async update(id: string, data: UpdateUserDTO): Promise<UserDTO> {
    try {
      // Validate input
      const validated = await updateUserSchema.parseAsync(data);
      
      // Check if user exists
      const existing = await this.userRepository.findById(id);
      if (!existing) {
        throw new BusinessError('User not found', undefined, 'NOT_FOUND', 404);
      }

      // Update user
      const updateData: any = { ...validated };
      
      // Convert string dates to Date for database if they exist
      if ('employmentStartDate' in validated && validated.employmentStartDate) {
        updateData.employmentStartDate = new Date(validated.employmentStartDate);
      }
      if ('employmentEndDate' in validated && (validated as any).employmentEndDate) {
        updateData.employmentEndDate = new Date((validated as any).employmentEndDate);
      }
      
      const updated = await this.userRepository.update(id, updateData);

      // Emit event
      await this.eventBus.emit('user.updated', {
        userId: updated.id,
        changes: validated,
        timestamp: new Date()
      });

      this.logger.info(`User updated successfully: ${id}`);
      return UserMapper.toDTO(updated);
    } catch (error) {
      this.logger.error(`Error updating user: ${id}`, error);
      throw error instanceof BusinessError ? error : new BusinessError('Failed to update user', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Check if user exists
      const existing = await this.userRepository.findById(id);
      if (!existing) {
        throw new BusinessError('User not found', undefined, 'NOT_FOUND', 404);
      }

      // Soft delete
      await this.userRepository.softDelete(id);

      // Emit event
      await this.eventBus.emit('user.deleted', {
        userId: id,
        timestamp: new Date()
      });

      this.logger.info(`User deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting user: ${id}`, error);
      throw error instanceof BusinessError ? error : new BusinessError('Failed to delete user', error);
    }
  }

  async authenticate(email: string, password: string): Promise<UserDTO> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user || !user.password) {
        throw new UnauthorizedError('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is deactivated');
      }

      const isValid = await compare(password, user.password);
      if (!isValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      // Emit event
      await this.eventBus.emit('user.authenticated', {
        userId: user.id,
        method: 'password',
        timestamp: new Date()
      });

      this.logger.info(`User authenticated successfully: ${user.id}`);
      return UserMapper.toDTO(user);
    } catch (error) {
      this.logger.error('Authentication error', error);
      throw error instanceof BusinessError ? error : new BusinessError('Authentication failed', error);
    }
  }

  async findMany(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  } = {}): Promise<{ users: UserDTO[]; total: number; }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        isActive = true
      } = options;

      const skip = (page - 1) * limit;
      const where: any = {
        isActive,
        deletedAt: null
      };

      if (role) {
        where.role = role;
      }

      let users: User[];
      
      if (search) {
        users = await this.userRepository.searchUsers(search, {
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        });
      } else {
        users = await this.userRepository.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        });
      }

      const total = await this.userRepository.count(where);

      return {
        users: users.map(user => UserMapper.toDTO(user)),
        total
      };
    } catch (error) {
      this.logger.error('Error finding users', error);
      throw new BusinessError('Failed to find users', error);
    }
  }

  async getUserWithStats(id: string): Promise<UserDTO & { stats: any } | null> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return null;
      }

      const stats = await this.userRepository.getUserStats(id);
      
      return {
        ...UserMapper.toDTO(user),
        stats
      };
    } catch (error) {
      this.logger.error(`Error getting user with stats: ${id}`, error);
      throw new BusinessError('Failed to get user statistics', error);
    }
  }

  async bulkCreate(users: CreateUserDTO[]): Promise<UserDTO[]> {
    try {
      // Validate all users
      const validatedUsers = await Promise.all(
        users.map(user => createUserSchema.parseAsync(user))
      );

      // Hash all passwords
      const usersWithHashedPasswords = await Promise.all(
        validatedUsers.map(async user => ({
          ...user,
          password: await hash(user.password)
        }))
      );

      // Create users in transaction
      const createdUsers = await this.transactionManager.execute(async (tx) => {
        // Convert string dates to Date objects for database
        const usersWithDates = usersWithHashedPasswords.map(user => {
          const userData: any = { ...user };
          if (user.employmentStartDate) {
            userData.employmentStartDate = new Date(user.employmentStartDate);
          }
          if ((user as any).employmentEndDate) {
            userData.employmentEndDate = new Date((user as any).employmentEndDate);
          }
          return userData;
        });
        // Use the repository's bulk create method
        return await this.userRepository.bulkCreate(usersWithDates);
      });

      // Emit events for all created users
      for (const user of createdUsers) {
        await this.eventBus.emit('user.created', {
          userId: user.id,
          email: user.email || '',
          role: user.role,
          timestamp: new Date()
        });
      }

      this.logger.info(`Bulk created ${createdUsers.length} users`);
      return createdUsers.map(user => UserMapper.toDTO(user));
    } catch (error) {
      this.logger.error('Error in bulk create users', error);
      throw error instanceof BusinessError ? error : new BusinessError('Failed to bulk create users', error);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user || !user.password) {
        throw new BusinessError('User not found', undefined, 'NOT_FOUND', 404);
      }

      // Verify current password
      const isCurrentValid = await compare(currentPassword, user.password);
      if (!isCurrentValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Validate new password
      const validation = await createUserSchema.shape.password.safeParseAsync(newPassword);
      if (!validation.success) {
        throw new BusinessError('Invalid password format');
      }

      // Hash new password
      const hashedNewPassword = await hash(newPassword);

      // Update password
      await this.userRepository.update(userId, {
        password: hashedNewPassword
      } as UpdateUserDTO);

      this.logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error changing password for user: ${userId}`, error);
      throw error instanceof BusinessError ? error : new BusinessError('Failed to change password', error);
    }
  }
}