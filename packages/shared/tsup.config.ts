import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/types/index.ts',
    'src/mappers/index.ts',
    'src/constants/index.ts',
    'src/utils/index.ts',
    'src/storage/index.ts',
    'src/storage/mobile.ts',
    'src/storage/web.ts'
  ],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    // Use the same entry points for DTS
    entry: [
      'src/index.ts',
      'src/types/index.ts',
      'src/mappers/index.ts',
      'src/constants/index.ts',
      'src/utils/index.ts',
      'src/storage/index.ts',
      'src/storage/mobile.ts',
      'src/storage/web.ts'
    ],
    // Ensure TypeScript can find all files
    compilerOptions: {
      composite: false,
      incremental: false
    }
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  tsconfig: './tsconfig.json',
  external: ['react', 'react-native', 'next', 'expo-secure-store', 'react-native-mmkv'],
  noExternal: ['@repo/database', 'zod'],
  // Disable experimental DTS to avoid issues
  experimentalDts: false,
  // Bundle everything to avoid module resolution issues
  bundle: true,
  // Skip node modules
  skipNodeModulesBundle: true
})