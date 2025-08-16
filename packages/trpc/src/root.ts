import { router, publicProcedure } from './server';
import { authRouter, userRouter, projectRouter, taskRouter, vehicleRouter } from './routers';
import { healthCheckMiddleware } from './middleware/performance';

/**
 * Main application router that combines all feature routers
 * This is the single point of entry for all tRPC procedures
 */
export const appRouter = router({
  // Health check endpoint
  health: publicProcedure
    .use(healthCheckMiddleware)
    .query(() => ({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    })),

  // System information (public)
  info: publicProcedure
    .query(() => ({
      name: 'StarTynk API',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })),

  // Feature routers
  auth: authRouter,
  user: userRouter,
  project: projectRouter,
  task: taskRouter,
  vehicle: vehicleRouter,
});

/**
 * Export the router type for use in client applications
 * This type will be used to ensure type safety between server and client
 */
export type AppRouter = typeof appRouter;