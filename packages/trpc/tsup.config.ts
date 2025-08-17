import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/server.ts',
    'src/client.ts',
    'src/context.ts',
    'src/routers/index.ts',
    'src/middleware/index.ts'
  ],
  format: ['cjs', 'esm'],
  target: 'es2022',
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  splitting: false,
  external: [
    '@repo/database',
    '@repo/shared',
    '@repo/auth',
    '@repo/utils',
    '@repo/validation',
    '@repo/features',
    '@trpc/server',
    '@trpc/client',
    '@trpc/react-query',
    '@trpc/next',
    '@tanstack/react-query',
    'superjson',
    'zod',
    'next'
  ],
  treeshake: true,
  platform: 'node',
});