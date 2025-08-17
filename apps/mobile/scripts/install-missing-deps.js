#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of common missing dependencies for React Native Web
const commonMissingDeps = [
  'ansi-styles',
  'event-target-shim',
  'shallowequal',
  'styleq@0.1.3',
  'escape-string-regexp',
  'postcss-value-parser',
  'query-string',
  'fast-deep-equal',
  'inline-style-prefixer',
  'css-in-js-utils',
  'normalize-css-color',
  'pretty-format',
];

console.log('Installing common missing dependencies for React Native Web...\n');

commonMissingDeps.forEach(dep => {
  try {
    console.log(`Installing ${dep}...`);
    execSync(`pnpm add ${dep}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to install ${dep}:`, error.message);
  }
});

console.log('\nAll dependencies installed!');
console.log('You may need to clear Metro cache: npx expo start --clear');