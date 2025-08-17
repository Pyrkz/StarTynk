import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';

import { appConfig } from './config/app';
import { Database } from './config/database';
import jwtPlugin from './shared/plugins/jwt.plugin';
import { authRoutes } from './features/auth/auth.routes';

// Load environment variables
dotenv.config();

// Create Fastify instance
const fastify = Fastify({
  logger: appConfig.logger,
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, appConfig.cors);

  // Cookie support
  await fastify.register(cookie);

  // Rate limiting
  await fastify.register(rateLimit, appConfig.rateLimit);

  // JWT
  await fastify.register(jwtPlugin);
}

// Register routes
async function registerRoutes() {
  // Health check
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  });

  // API routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  
  // Add other feature routes here as they are created
  // await fastify.register(userRoutes, { prefix: '/api/users' });
  // await fastify.register(projectRoutes, { prefix: '/api/projects' });
}

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  // Send error response
  reply.status(error.statusCode || 500).send({
    statusCode: error.statusCode || 500,
    error: error.name || 'Internal Server Error',
    message: error.message || 'Something went wrong',
  });
});

// Start server
async function start() {
  try {
    // Connect to database
    await Database.connect();

    // Register plugins and routes
    await registerPlugins();
    await registerRoutes();

    // Start listening
    await fastify.listen({ 
      port: appConfig.port, 
      host: appConfig.host 
    });

    console.log(`🚀 Server is running on http://${appConfig.host}:${appConfig.port}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (err) {
    fastify.log.error(err);
    await Database.disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  await fastify.close();
  await Database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  await fastify.close();
  await Database.disconnect();
  process.exit(0);
});

// Start the server
start();