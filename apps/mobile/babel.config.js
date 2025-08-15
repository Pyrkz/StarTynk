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
            '@components': './src/components',
            '@features': './src/features',
            '@lib': './src/lib',
            '@utils': './src/utils',
            '@hooks': './src/hooks',
            '@assets': './assets',
            '@repo/api': '../../packages/api/src',
            '@repo/database': '../../packages/database/src',
            '@repo/shared': '../../packages/shared/src'
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