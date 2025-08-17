import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@prisma/client';
import { JWTPayload } from './auth.types';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ 
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required' 
    });
  }
}

export function authorize(...allowedRoles: Role[]) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // First authenticate
    await authenticate(request, reply);

    // Then check role
    if (!request.user) {
      return reply.code(401).send({ 
        statusCode: 401,
        error: 'Unauthorized',
        message: 'User not authenticated' 
      });
    }

    if (!allowedRoles.includes(request.user.role as Role)) {
      return reply.code(403).send({ 
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permissions' 
      });
    }
  };
}