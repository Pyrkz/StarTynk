// Export the main app router and its type
export { appRouter, type AppRouter } from './root';

// Export server configuration
export * from './server';

// Export client configuration  
export * from './client';

// Export context types and creators
export {
  type Context,
  type BaseContext,
  type AuthenticatedContext,
  type TRPCContext,
  createContext,
  createFastifyContext,
  createNodeContext,
  createGenericContext,
  isAuthenticatedContext,
  addUserToContext,
} from './context';

// Export all routers for standalone use if needed
export {
  authRouter,
  userRouter,
  projectRouter,
  taskRouter,
  vehicleRouter,
} from './routers';

// Export all middleware
export * from './middleware';

// Re-export tRPC types that consumers might need
export type { TRPCError } from '@trpc/server';
export type { 
  inferRouterInputs, 
  inferRouterOutputs,
  CreateTRPCReact 
} from '@trpc/react-query';