import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { AuthService } from './auth.service';
import { LoginInput, RefreshTokenInput } from './auth.schemas';
import { jwtConfig } from '../../config/jwt';
import { JWTPayload } from './auth.types';

export class AuthController {
  private authService: AuthService;

  constructor(fastify: FastifyInstance) {
    this.authService = new AuthService(fastify);
  }

  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const result = await this.authService.login(request.body);

      // Set refresh token as HTTP-only cookie
      reply.setCookie(
        jwtConfig.cookie.cookieName,
        result.refreshToken!,
        jwtConfig.cookie
      );

      // Don't send refresh token in response body
      const { refreshToken, ...response } = result;

      reply.code(200).send(response);
    } catch (error) {
      throw error;
    }
  }

  async refresh(
    request: FastifyRequest<{ Body: RefreshTokenInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Get refresh token from cookie or body (for mobile apps)
      const refreshToken = 
        request.cookies[jwtConfig.cookie.cookieName] || 
        request.body.refreshToken;

      if (!refreshToken) {
        throw reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Refresh token not provided',
        });
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      // Set new refresh token as cookie
      reply.setCookie(
        jwtConfig.cookie.cookieName,
        result.refreshToken!,
        jwtConfig.cookie
      );

      // Don't send refresh token in response body
      const { refreshToken: _, ...response } = result;

      reply.code(200).send(response);
    } catch (error) {
      throw error;
    }
  }

  async logout(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Clear refresh token cookie
      reply.clearCookie(jwtConfig.cookie.cookieName);

      // Get user from JWT token if authenticated
      if (request.user) {
        await this.authService.logout(request.user.sub);
      }

      reply.code(200).send({ 
        message: 'Logged out successfully' 
      });
    } catch (error) {
      throw error;
    }
  }

  async me(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const user = request.user as JWTPayload;
      const currentUser = await this.authService.getCurrentUser(user.sub);

      reply.code(200).send({ user: currentUser });
    } catch (error) {
      throw error;
    }
  }
}