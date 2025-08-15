const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Get the project paths
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Get default config
const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [
  monorepoRoot,
  // Explicitly add packages
  path.resolve(monorepoRoot, 'packages/shared'),
  path.resolve(monorepoRoot, 'packages/api'),
  path.resolve(monorepoRoot, 'packages/database'),
];

// 2. Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies only from nodeModulesPaths
config.resolver.disableHierarchicalLookup = true;

// 4. Configure resolver for package aliases
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @repo/* aliases
  if (moduleName.startsWith('@repo/')) {
    const packageName = moduleName.replace('@repo/', '');
    const [pkg, ...rest] = packageName.split('/');
    const packagePath = path.join(
      monorepoRoot,
      'packages',
      pkg,
      'src',
      ...rest
    );
    
    return {
      filePath: packagePath.endsWith('.ts') || packagePath.endsWith('.tsx') 
        ? packagePath 
        : packagePath + '/index.ts',
      type: 'sourceFile',
    };
  }
  
  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

// 5. Handle TypeScript and JavaScript files
config.resolver.sourceExts = [
  'expo.ts',
  'expo.tsx',
  'expo.js',
  'expo.jsx',
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'mjs',
  'cjs'
];

// 6. Enable symlinks
config.resolver.unstable_enableSymlinks = true;

// 7. Reset cache for development
config.resetCache = true;

// 8. Transformer configuration
config.transformer.unstable_allowRequireContext = true;
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Apply NativeWind configuration
module.exports = withNativeWind(config, { 
  input: './src/styles/global.css',
  configPath: './tailwind.config.ts'
});