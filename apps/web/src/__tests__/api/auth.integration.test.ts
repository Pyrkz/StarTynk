import { createMocks } from 'node-mocks-http';
import { prisma } from '@repo/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { POST as loginHandler } from '@/app/api/v1/auth/login/route';
import { POST as registerHandler } from '@/app/api/v1/auth/register/route';
import { POST as refreshHandler } from '@/app/api/v1/auth/refresh/route';

// Test database setup
beforeAll(async () => {
  // Clean database
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Authentication API Integration Tests', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with email', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'web',
        },
        body: {
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test User',
        },
      });

      await registerHandler(req as any);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('test@example.com');
      
      // Verify user in database
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(user).toBeTruthy();
      expect(user?.emailVerified).toBeNull();
    });

    it('should register a new user with phone', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'mobile',
        },
        body: {
          phone: '+1234567890',
          password: 'Test123!@#',
          name: 'Mobile User',
        },
      });

      await registerHandler(req as any);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.user.phone).toBe('+1234567890');
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          password: await bcrypt.hash('password', 10),
          name: 'First User',
        },
      });

      // Attempt duplicate registration
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'duplicate@example.com',
          password: 'Test123!@#',
          name: 'Second User',
        },
      });

      await registerHandler(req as any);

      expect(res._getStatusCode()).toBe(409);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('USER_EXISTS');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await prisma.user.create({
        data: {
          email: 'login@example.com',
          phone: '+9876543210',
          password: await bcrypt.hash('Test123!@#', 10),
          name: 'Login Test User',
          emailVerified: new Date(),
          phoneVerified: new Date(),
        },
      });
    });

    it('should login with email for web client', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'web',
        },
        body: {
          identifier: 'login@example.com',
          password: 'Test123!@#',
          loginMethod: 'email',
        },
      });

      await loginHandler(req as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('login@example.com');
      expect(data.data.sessionId).toBeDefined();
      expect(data.data.accessToken).toBeUndefined(); // Web uses cookies
    });

    it('should login with phone for mobile client', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'mobile',
        },
        body: {
          identifier: '+9876543210',
          password: 'Test123!@#',
          loginMethod: 'phone',
        },
      });

      await loginHandler(req as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.user.phone).toBe('+9876543210');
      expect(data.data.accessToken).toBeDefined();
      expect(data.data.refreshToken).toBeDefined();
      
      // Verify JWT tokens
      const decoded = jwt.verify(
        data.data.accessToken,
        process.env.JWT_SECRET!
      ) as any;
      expect(decoded.userId).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          identifier: 'login@example.com',
          password: 'WrongPassword',
        },
      });

      await loginHandler(req as any);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should handle rate limiting', async () => {
      // Simulate multiple failed attempts
      for (let i = 0; i < 6; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          headers: {
            'X-Forwarded-For': '192.168.1.1',
          },
          body: {
            identifier: 'login@example.com',
            password: 'WrongPassword',
          },
        });

        await loginHandler(req as any);
        
        if (i === 5) {
          expect(res._getStatusCode()).toBe(429);
          const data = JSON.parse(res._getData());
          expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
        }
      }
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh access token with valid refresh token', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'refresh@example.com',
          password: await bcrypt.hash('password', 10),
        },
      });

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'X-Client-Type': 'mobile',
        },
        body: { refreshToken },
      });

      await refreshHandler(req as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.accessToken).toBeDefined();
      expect(data.data.refreshToken).toBeDefined();
    });
  });
});