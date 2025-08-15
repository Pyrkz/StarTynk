import { describe, it, expect, beforeEach, jest, beforeAll, afterAll } from '@jest/globals';
import { UserService } from './user.service';
import { UserRepository } from '../../repositories/user';
import { EventBus } from '../../events';
import { TransactionManager } from '../../transactions';
import { Logger } from '@repo/utils/logger';
import { BusinessError, UnauthorizedError, ConflictError } from '../../errors';
import { hash } from '@repo/utils/crypto';
import { Role } from '@repo/database';

// Mock all external dependencies
jest.mock('../../repositories/user/user.repository');
jest.mock('../../events/event-bus');
jest.mock('../../transactions/transaction.manager');
jest.mock('@repo/utils/logger');
jest.mock('@repo/utils/crypto');

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockTransactionManager: jest.Mocked<TransactionManager>;
  let mockLogger: jest.Mocked<Logger>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed_password',
    role: Role.USER,
    isActive: true,
    phone: '+48123456789',
    position: 'Developer',
    department: 'IT',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    emailVerified: null,
    image: null,
    invitedBy: null,
    employmentEndDate: null,
    employmentStartDate: null,
    lastLoginAt: null,
    loginCount: 0
  };

  beforeAll(() => {
    // Setup global mocks
    (hash as jest.MockedFunction<typeof hash>).mockResolvedValue('hashed_password');
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      updateLastLogin: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      searchUsers: jest.fn(),
      getUserStats: jest.fn(),
      bulkCreate: jest.fn(),
    } as any;

    mockEventBus = {
      emit: jest.fn(),
    } as any;

    mockTransactionManager = {
      execute: jest.fn(),
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    userService = new UserService(
      mockRepository, 
      mockEventBus, 
      mockTransactionManager,
      mockLogger
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('findById', () => {
    it('should return user DTO when user exists', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.findById('1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.password).toBeUndefined(); // Password should be removed in DTO
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
      expect(mockLogger.debug).toHaveBeenCalledWith('Finding user by id: 1');
    });

    it('should return null when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await userService.findById('999');

      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith('999');
    });

    it('should throw BusinessError on repository error', async () => {
      mockRepository.findById.mockRejectedValue(new Error('DB Error'));

      await expect(userService.findById('1')).rejects.toThrow(BusinessError);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const createData = {
      email: 'new@example.com',
      name: 'New User',
      password: 'SecurePass123!',
      role: Role.USER,
    };

    it('should create user successfully', async () => {
      const createdUser = {
        ...mockUser,
        id: '2',
        email: createData.email,
        name: createData.name,
        password: 'hashed_password',
      };

      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdUser);
      mockEventBus.emit.mockResolvedValue(undefined);

      const result = await userService.create(createData);

      expect(result).toBeDefined();
      expect(result.id).toBe('2');
      expect(result.password).toBeUndefined();
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createData,
        password: 'hashed_password'
      });
      expect(mockEventBus.emit).toHaveBeenCalledWith('user.created', expect.objectContaining({
        userId: '2',
        email: createData.email,
        role: Role.USER
      }));
      expect(mockLogger.info).toHaveBeenCalledWith('User created successfully: 2');
    });

    it('should throw ConflictError if user with email already exists', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(userService.create(createData)).rejects.toThrow(ConflictError);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if user with phone already exists', async () => {
      const dataWithPhone = { ...createData, phone: '+48123456789' };
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findByPhone.mockResolvedValue(mockUser);

      await expect(userService.create(dataWithPhone)).rejects.toThrow(ConflictError);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      const createdUser = { ...mockUser, id: '2' };
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdUser);
      mockEventBus.emit.mockResolvedValue(undefined);

      await userService.create(createData);

      expect(hash).toHaveBeenCalledWith(createData.password);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createData,
        password: 'hashed_password'
      });
    });
  });

  describe('authenticate', () => {
    beforeEach(() => {
      // Mock compare function
      const { compare } = require('@repo/utils/crypto');
      compare.mockResolvedValue(true);
    });

    it('should authenticate user with valid credentials', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);
      mockRepository.updateLastLogin.mockResolvedValue(undefined);
      mockEventBus.emit.mockResolvedValue(undefined);

      const result = await userService.authenticate('test@example.com', 'password');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.password).toBeUndefined();
      expect(mockRepository.updateLastLogin).toHaveBeenCalledWith('1');
      expect(mockEventBus.emit).toHaveBeenCalledWith('user.authenticated', expect.any(Object));
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      await expect(
        userService.authenticate('nonexistent@example.com', 'password')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockRepository.findByEmail.mockResolvedValue(inactiveUser);

      await expect(
        userService.authenticate('test@example.com', 'password')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      const { compare } = require('@repo/utils/crypto');
      compare.mockResolvedValue(false);
      
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        userService.authenticate('test@example.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('findMany', () => {
    it('should return paginated users', async () => {
      const users = [mockUser, { ...mockUser, id: '2' }];
      mockRepository.findMany.mockResolvedValue(users);
      mockRepository.count.mockResolvedValue(10);

      const result = await userService.findMany({ page: 1, limit: 2 });

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.users[0].password).toBeUndefined();
      expect(mockRepository.findMany).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: null },
        skip: 0,
        take: 2,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should filter by role when provided', async () => {
      mockRepository.findMany.mockResolvedValue([mockUser]);
      mockRepository.count.mockResolvedValue(1);

      await userService.findMany({ role: Role.ADMIN });

      expect(mockRepository.findMany).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: null, role: Role.ADMIN },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should use search when provided', async () => {
      mockRepository.searchUsers.mockResolvedValue([mockUser]);
      mockRepository.count.mockResolvedValue(1);

      await userService.findMany({ search: 'test' });

      expect(mockRepository.searchUsers).toHaveBeenCalledWith('test', {
        where: { isActive: true, deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple users in transaction', async () => {
      const usersData = [
        { email: 'user1@test.com', name: 'User 1', password: 'pass1', role: Role.USER },
        { email: 'user2@test.com', name: 'User 2', password: 'pass2', role: Role.USER },
      ];

      const createdUsers = [
        { ...mockUser, id: '1', email: 'user1@test.com' },
        { ...mockUser, id: '2', email: 'user2@test.com' },
      ];

      mockTransactionManager.execute.mockImplementation((callback) => 
        Promise.resolve(callback({} as any))
      );
      mockRepository.bulkCreate.mockResolvedValue(createdUsers);
      mockEventBus.emit.mockResolvedValue(undefined);

      const result = await userService.bulkCreate(usersData);

      expect(result).toHaveLength(2);
      expect(result[0].password).toBeUndefined();
      expect(hash).toHaveBeenCalledTimes(2);
      expect(mockEventBus.emit).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Bulk created 2 users');
    });
  });

  describe('getUserWithStats', () => {
    it('should return user with statistics', async () => {
      const stats = {
        projectCount: 5,
        taskCount: 12,
        vehicleCount: 1,
        equipmentCount: 3
      };

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.getUserStats.mockResolvedValue(stats);

      const result = await userService.getUserWithStats('1');

      expect(result).toBeDefined();
      expect(result?.stats).toEqual(stats);
      expect(result?.password).toBeUndefined();
    });

    it('should return null for non-existent user', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await userService.getUserWithStats('999');

      expect(result).toBeNull();
      expect(mockRepository.getUserStats).not.toHaveBeenCalled();
    });
  });
});