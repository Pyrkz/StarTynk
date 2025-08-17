const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// Add additional watch folders for problematic modules if needed
// (currently not needed as we use shims)

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force Metro to resolve (sub)dependencies only from nodeModulesPaths
config.resolver.disableHierarchicalLookup = true;

// Add extra node modules for commonly missing packages
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'event-target-shim': path.join(projectRoot, 'node_modules', 'event-target-shim'),
  'shallowequal': path.join(projectRoot, 'node_modules', 'shallowequal'),
  'styleq': path.join(projectRoot, 'node_modules', 'styleq'),
  'styleq/transform-localize-style': path.join(projectRoot, 'node_modules', 'styleq', 'transform-localize-style.js'),
  'ansi-styles': path.join(projectRoot, 'node_modules', 'ansi-styles'),
  'punycode': path.join(projectRoot, 'node_modules', 'punycode'),
};

// Web-specific configuration
config.resolver.platforms = ['ios', 'android', 'web'];

// Add source extensions for better module resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

// Add asset extensions
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');

// Enhanced resolver for web and problematic modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle punycode specifically - use our shim
  if (moduleName === 'punycode' || moduleName === 'punycode/') {
    return {
      filePath: path.join(projectRoot, 'src', 'shims', 'punycode.js'),
      type: 'sourceFile',
    };
  }
  
  // Fix HMRClient import issue
  if (moduleName === '@expo/metro-runtime/build/HMRClient') {
    try {
      const hmrClientPath = require.resolve('@expo/metro-runtime/build/HMRClient.js', {
        paths: [projectRoot, monorepoRoot]
      });
      return {
        filePath: hmrClientPath,
        type: 'sourceFile',
      };
    } catch (e) {
      // Fallback to empty module
      return {
        filePath: path.join(__dirname, 'src', 'polyfills.js'),
        type: 'sourceFile',
      };
    }
  }
  
  // Handle styleq sub-modules specially
  if (moduleName.startsWith('styleq/')) {
    const subModule = moduleName.split('/')[1];
    const styleqPaths = [
      path.join(projectRoot, 'node_modules', 'styleq', `${subModule}.js`),
      path.join(projectRoot, 'node_modules', 'styleq', subModule, 'index.js'),
      path.join(monorepoRoot, 'node_modules', 'styleq', `${subModule}.js`),
      path.join(monorepoRoot, 'node_modules', 'styleq', subModule, 'index.js'),
    ];
    
    for (const stylePath of styleqPaths) {
      if (require('fs').existsSync(stylePath)) {
        return {
          filePath: stylePath,
          type: 'sourceFile',
        };
      }
    }
  }
  
  // List of modules that need special handling
  const specialModules = ['event-target-shim', 'shallowequal', 'styleq', 'ansi-styles', 'punycode'];
  
  if (specialModules.includes(moduleName)) {
    // Try multiple resolution strategies
    const resolutionPaths = [
      projectRoot,
      path.join(projectRoot, 'node_modules'),
      monorepoRoot,
      path.join(monorepoRoot, 'node_modules'),
    ];
    
    for (const basePath of resolutionPaths) {
      try {
        const modulePath = require.resolve(moduleName, { paths: [basePath] });
        return {
          filePath: modulePath,
          type: 'sourceFile',
        };
      } catch (e) {
        // Try next path
      }
    }
    
    // If all else fails, try direct path construction
    try {
      const directPath = path.join(projectRoot, 'node_modules', moduleName, 'index.js');
      if (require('fs').existsSync(directPath)) {
        return {
          filePath: directPath,
          type: 'sourceFile',
        };
      }
    } catch (e) {
      // Continue to default resolver
    }
  }
  
  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

// Server configuration
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set proper headers for JavaScript files
      if (req.url && (req.url.includes('.bundle') || req.url.endsWith('.js'))) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;