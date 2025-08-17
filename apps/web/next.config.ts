import type { NextConfig } from "next";
import { createHash } from "crypto";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds for faster deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Also disable TypeScript checks during builds for faster deployment
    ignoreBuildErrors: true,
  },
  
  // Transpile packages that need it
  transpilePackages: ['@repo/api', '@repo/auth', '@repo/shared', '@repo/features', '@repo/database'],
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Experimental features for optimization
  experimental: {
    optimizePackageImports: [
      '@repo/shared',
      '@repo/features',
      '@tanstack/react-query',
      'lodash',
      'date-fns',
      'lucide-react',
    ],
  },

  // Bundle analysis
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
      return config;
    },
  }),

  // Advanced webpack configuration
  webpack: (config: any, { dev, isServer }) => {
    // Configure module resolution
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    
    // Alias React Native and Expo modules to empty modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'expo-secure-store': false,
      'react-native-mmkv': false,
      '@react-native-community/netinfo': false,
      'expo-device': false,
      'expo-constants': false,
    };
    
    // Alias React Native to react-native-web for web compatibility
    if (!isServer) {
      config.resolve.alias['react-native$'] = 'react-native-web';
    }
    
    // Configure fallbacks for Node.js modules not available in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      buffer: false,
    };
    
    // Production optimizations
    if (!dev && !isServer) {
      // Enable tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Advanced code splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: false,
          vendors: false,
          
          // Framework chunk (React, Next.js)
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          
          // Large third-party libraries
          lib: {
            test(module: any) {
              return (
                module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier())
              );
            },
            name(module: any) {
              const hash = createHash('sha1');
              hash.update(module.identifier());
              return hash.digest('hex').substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          
          // Common chunks
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 20,
          },
          
          // Shared packages from our monorepo
          shared: {
            name(module: any, chunks: any[]) {
              return (
                createHash('sha1')
                  .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                  .digest('hex') + '_shared'
              );
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      };
      
      // Minimize chunk names in production
      config.optimization.chunkIds = 'deterministic';
      config.optimization.moduleIds = 'deterministic';
    }

    // Bundle analyzer integration
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: `../../bundle-analysis-${isServer ? 'server' : 'client'}.html`,
        })
      );
    }

    return config;
  },
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
