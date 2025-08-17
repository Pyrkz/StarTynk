// Import types from our tRPC package
import type { AppRouter, RouterInputs, RouterOutputs } from '@repo/trpc';
import { createTRPCReact } from '@trpc/react-query';

// Create tRPC React instance with our AppRouter type
export const trpc = createTRPCReact<AppRouter>();

// Re-export types for convenience
export type { AppRouter, RouterInputs, RouterOutputs };