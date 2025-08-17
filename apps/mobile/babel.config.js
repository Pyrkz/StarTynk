module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { 
        jsxImportSource: 'nativewind',
        lazyImports: true
      }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json'
          ],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/features': './src/features',
            '@/lib': './src/lib',
            '@/utils': './src/utils',
            '@/hooks': './src/hooks',
            '@/shared': './src/shared',
            '@/providers': './src/providers',
            '@/services': './src/services',
            '@/screens': './src/screens',
            '@/navigation': './src/navigation',
            '@/config': './src/config',
            '@/styles': './src/styles',
            '@/assets': './assets'
          }
        }
      ],
      [
        'module:react-native-dotenv',
        {
          envName: 'APP_ENV',
          moduleName: '@env',
          path: '.env',
          safe: true,
          allowUndefined: false,
          verbose: false
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};