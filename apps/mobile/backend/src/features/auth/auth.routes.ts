import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { authenticate } from './auth.middleware';
import { 
  LoginSchema, 
  RefreshTokenSchema, 
  AuthResponseSchema, 
  ErrorResponseSchema 
} from './auth.schemas';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const authController = new AuthController(fastify);

  // Login endpoint
  fastify.post('/login', {
    schema: {
      body: LoginSchema,
      response: {
        200: AuthResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
      },
      tags: ['auth'],
      description: 'Login with email/phone and password',
    },
  }, authController.login.bind(authController));

  // Refresh token endpoint
  fastify.post('/refresh', {
    schema: {
      body: RefreshTokenSchema,
      response: {
        200: AuthResponseSchema,
        401: ErrorResponseSchema,
      },
      tags: ['auth'],
      description: 'Refresh access token using refresh token',
    },
  }, authController.refresh.bind(authController));

  // Logout endpoint
  fastify.post('/logout', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
      tags: ['auth'],
      description: 'Logout and invalidate session',
    },
  }, authController.logout.bind(authController));

  // Get current user endpoint
  fastify.get('/me', {
    onRequest: [authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: ['string', 'null'] },
                email: { type: 'string' },
                phone: { type: ['string', 'null'] },
                role: { type: 'string' },
                isActive: { type: 'boolean' },
                position: { type: ['string', 'null'] },
                department: { type: ['string', 'null'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
      tags: ['auth'],
      description: 'Get current authenticated user',
    },
  }, authController.me.bind(authController));
}