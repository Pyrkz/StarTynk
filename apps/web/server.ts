import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { validateStartup } from './src/lib/startup';
import { EnvLoader } from '@repo/config/env';

const logger = {
  info: (message: string, data?: any) => console.log(`ℹ️  ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  error: (message: string, error?: any) => console.error(`❌ ${message}`, error),
  warn: (message: string, data?: any) => console.warn(`⚠️  ${message}`, data ? JSON.stringify(data, null, 2) : ''),
};

async function start() {
  try {
    // Load and validate environment first
    logger.info('🔧 Loading environment configuration...');
    const env = EnvLoader.load({ 
      strict: true,
      silent: false 
    });
    
    // Run full startup validation
    await validateStartup();
    
    const dev = env.NODE_ENV !== 'production';
    const hostname = 'localhost';
    const port = env.PORT;
    
    // Initialize Next.js app
    logger.info('🏗️  Initializing Next.js application...');
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();
    
    await app.prepare();
    logger.info('✅ Next.js application prepared');
    
    // Create HTTP server
    const server = createServer(async (req, res) => {
      try {
        // Add CORS headers
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', env.ALLOWED_ORIGINS.join(','));
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.statusCode = 200;
          res.end();
          return;
        }
        
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        logger.error('Error occurred handling request:', err);
        res.statusCode = 500;
        res.end('Internal server error');
      }
    });
    
    // Handle server shutdown gracefully
    const shutdown = async (signal: string) => {
      logger.info(`📴 Received ${signal}, shutting down gracefully...`);
      
      server.close(async (err) => {
        if (err) {
          logger.error('Error during server shutdown:', err);
          process.exit(1);
        }
        
        try {
          // Close database connections
          const { prisma } = await import('@repo/database');
          await prisma.$disconnect();
          logger.info('✅ Database connections closed');
          
          logger.info('✅ Server shutdown complete');
          process.exit(0);
        } catch (error) {
          logger.error('Error during cleanup:', error);
          process.exit(1);
        }
      });
    };
    
    // Listen for shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    
    // Start the server
    server.listen(port, () => {
      logger.info(`🚀 Server ready on http://${hostname}:${port}`);
      
      if (env.isDevelopment) {
        logger.info('🔧 Development mode features:');
        logger.info('  - Hot reload enabled');
        logger.info('  - Debug logging active');
        logger.info(`  - Environment: ${env.NODE_ENV}`);
      }
      
      if (env.MAINTENANCE_MODE) {
        logger.warn('🚧 Application is in maintenance mode');
      }
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Export the start function for testing purposes
export { start };

// Start the server if this file is run directly
if (require.main === module) {
  start();
}