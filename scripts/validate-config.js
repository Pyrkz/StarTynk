#!/usr/bin/env node

/**
 * Configuration validation script
 * Tests the new configuration system without requiring build
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Configuration Validation Script');
console.log('=====================================');

// Test 1: Check if config package structure exists
console.log('\n1. Checking package structure...');

const configPackagePath = path.join(__dirname, '../packages/config');
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'src/index.ts',
  'src/env/env.schema.ts',
  'src/env/env.loader.ts',
  'src/configs/app.config.ts',
  'src/constants/environments.ts'
];

let structureValid = true;
for (const file of requiredFiles) {
  const filePath = path.join(configPackagePath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
    structureValid = false;
  }
}

// Test 2: Check environment files
console.log('\n2. Checking environment files...');

const rootPath = path.join(__dirname, '..');
const envFiles = [
  '.env.example',
  '.env.production',
  '.env.docker',
  'apps/web/.env.example',
  'apps/mobile/.env.example'
];

let envFilesValid = true;
for (const file of envFiles) {
  const filePath = path.join(rootPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
    envFilesValid = false;
  }
}

// Test 3: Check Docker configuration
console.log('\n3. Checking Docker configuration...');

const dockerFiles = ['Dockerfile', 'docker-compose.yml', '.dockerignore'];
let dockerValid = true;
for (const file of dockerFiles) {
  const filePath = path.join(rootPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
    dockerValid = false;
  }
}

// Test 4: Check deployment scripts
console.log('\n4. Checking deployment configuration...');

const deploymentFiles = ['scripts/deploy.sh'];
let deploymentValid = true;
for (const file of deploymentFiles) {
  const filePath = path.join(rootPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
    deploymentValid = false;
  }
}

// Test 5: Check Turborepo configuration
console.log('\n5. Checking Turborepo configuration...');

const turboPath = path.join(rootPath, 'turbo.json');
if (fs.existsSync(turboPath)) {
  const turboConfig = JSON.parse(fs.readFileSync(turboPath, 'utf8'));
  
  // Check if it has the new configuration
  const hasNewConfig = turboConfig.pipeline && turboConfig.pipeline.deploy;
  if (hasNewConfig) {
    console.log('✅ turbo.json updated with new pipeline');
  } else {
    console.log('⚠️  turbo.json exists but may need updates');
  }
} else {
  console.log('❌ turbo.json not found');
}

// Summary
console.log('\n📊 Summary');
console.log('============');

const allValid = structureValid && envFilesValid && dockerValid && deploymentValid;

if (allValid) {
  console.log('🎉 All configuration checks passed!');
  console.log('\nNext steps:');
  console.log('1. Build the config package: npm run build --workspace=packages/config');
  console.log('2. Install dependencies: npm install');
  console.log('3. Test the application: npm run dev');
  console.log('4. Validate with: npm run config:validate');
  process.exit(0);
} else {
  console.log('❌ Some configuration files are missing or incomplete.');
  console.log('\nPlease ensure all files are created properly.');
  process.exit(1);
}