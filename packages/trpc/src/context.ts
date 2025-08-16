import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http';
import { prisma } from '@repo/database';
import { type UnifiedUserDTO } from '@repo/shared';
import { verifyAccessToken, getSessionFromRequest } from '@repo/auth';
import type { NextApiRequest } from 'next';

/**
 * Base context that's available in all procedures
 */
export interface BaseContext {
  prisma: typeof prisma;
  requestId: string;
  userAgent?: string;
  ip?: string;
  user?: UnifiedUserDTO;
  sessionId?: string;
  authToken?: string;
  authType?: 'session' | 'jwt';
}

/**
 * Context available in authenticated procedures
 */
export interface AuthenticatedContext extends BaseContext {
  user: UnifiedUserDTO;
  userId: string;
  sessionId?: string;
  authToken?: string;
  authType: 'session' | 'jwt';
}

/**
 * Union type for all possible context configurations
 */
export type Context = BaseContext;

/**
 * Type guard to check if context has authenticated user
 */
export function isAuthenticatedContext(ctx: Context): ctx is AuthenticatedContext {
  return 'user' in ctx && 'userId' in ctx;
}

/**
 * Generate a unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract user agent from request headers
 */
function getUserAgent(headers: Record<string, string | string[] | undefined>): string | undefined {
  const userAgent = headers['user-agent'];
  return Array.isArray(userAgent) ? userAgent[0] : userAgent;
}

/**
 * Extract IP address from request
 */
function getIpAddress(
  req: any,
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  // Try various headers for IP address (in order of priority)
  const ipHeaders = [
    'x-forwarded-for',
    'cf-connecting-ip',
    'x-real-ip',
    'x-client-ip',
  ];

  for (const header of ipHeaders) {
    const value = headers[header];
    if (value) {
      const ip = Array.isArray(value) ? value[0] : value;
      // Take first IP if comma-separated
      return ip.split(',')[0]?.trim();
    }
  }

  // Fallback to connection remote address
  return req.socket?.remoteAddress || req.ip || req.connection?.remoteAddress;
}

/**
 * Authenticate request using either session or JWT
 */
async function authenticateRequest(req: any): Promise<{
  user?: UnifiedUserDTO;
  sessionId?: string;
  authToken?: string;
  authType?: 'session' | 'jwt';
}> {
  try {
    // Try JWT first (for mobile clients)
    const authHeader = req.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = await verifyAccessToken(token);
        if (payload?.userId) {
          // Fetch user from database
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
              avatar: true,
              phone: true,
              createdAt: true,
              updatedAt: true,
            },
          });
          
          if (user && user.isActive) {
            return {
              user: user as UnifiedUserDTO,
              authToken: token,
              authType: 'jwt',
            };
          }
        }
      } catch (jwtError) {
        console.warn('JWT verification failed:', jwtError);
      }
    }

    // Try session auth (for web clients)
    try {
      const sessionData = await getSessionFromRequest(req);
      if (sessionData?.user) {
        return {
          user: sessionData.user,
          sessionId: sessionData.sessionId,
          authType: 'session',
        };
      }
    } catch (sessionError) {
      console.warn('Session verification failed:', sessionError);
    }

    return {};
  } catch (error) {
    console.error('Authentication error:', error);
    return {};
  }
}

/**
 * Create tRPC context for Next.js API routes
 */
export async function createContext(opts: CreateNextContextOptions): Promise<BaseContext> {
  const { req, res } = opts;
  
  const requestId = generateRequestId();
  const userAgent = getUserAgent(req.headers);
  const ip = getIpAddress(req, req.headers);

  // Authenticate the request
  const auth = await authenticateRequest(req);

  return {
    prisma,
    requestId,
    userAgent,
    ip,
    ...auth,
  };
}

/**
 * Create tRPC context for Fastify
 */
export async function createFastifyContext(opts: CreateFastifyContextOptions): Promise<BaseContext> {
  const { req, res } = opts;
  
  const requestId = generateRequestId();
  const userAgent = getUserAgent(req.headers);
  const ip = getIpAddress(req, req.headers);

  return {
    prisma,
    requestId,
    userAgent,
    ip,
  };
}

/**
 * Create tRPC context for Node.js HTTP server
 */
export async function createNodeContext(opts: NodeHTTPCreateContextFnOptions<any, any>): Promise<BaseContext> {
  const { req, res } = opts;
  
  const requestId = generateRequestId();
  const userAgent = getUserAgent(req.headers || {});
  const ip = getIpAddress(req, req.headers || {});

  return {
    prisma,
    requestId,
    userAgent,
    ip,
  };
}

/**
 * Type for context creation function
 */
export type CreateContextFn = () => Promise<BaseContext> | BaseContext;

/**
 * Generic context creator that can be used with any adapter
 */
export function createGenericContext(): BaseContext {
  return {
    prisma,
    requestId: generateRequestId(),
  };
}

/**
 * Helper function to add user to context (used by auth middleware)
 */
export function addUserToContext(ctx: BaseContext, user: UnifiedUserDTO, sessionId?: string): AuthenticatedContext {
  return {
    ...ctx,
    user,
    userId: user.id,
    sessionId,
  };
}

/**
 * Export type for inference
 */
export type TRPCContext = Context;