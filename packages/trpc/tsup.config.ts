import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
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
    '@repo/validation'
  ],
  treeshake: true,
  platform: 'node',
});