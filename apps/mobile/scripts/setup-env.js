#!/usr/bin/env node

/**
 * Environment Setup Script for StarTynk Mobile
 * 
 * This script helps developers set up their environment configuration
 * by copying the example file and providing guidance.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const projectRoot = path.join(__dirname, '..');
const envExample = path.join(projectRoot, '.env.example');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🚀 StarTynk Mobile - Environment Setup\n');
  
  // Check if .env.example exists
  if (!fs.existsSync(envExample)) {
    console.error('❌ .env.example not found!');
    console.log('Please ensure you are running this script from the mobile app directory.');
    rl.close();
    return;
  }

  console.log('Available environments:');
  console.log('  1. development (local development)');
  console.log('  2. staging (testing environment)');
  console.log('  3. production (live environment)');
  console.log('  4. all (create all environment files)\n');

  const choice = await question('Which environment would you like to set up? (1-4): ');
  
  const environments = {
    '1': ['development'],
    '2': ['staging'], 
    '3': ['production'],
    '4': ['development', 'staging', 'production']
  };

  const selectedEnvs = environments[choice];
  
  if (!selectedEnvs) {
    console.log('❌ Invalid choice. Please run the script again.');
    rl.close();
    return;
  }

  for (const env of selectedEnvs) {
    await setupSingleEnvironment(env);
  }

  console.log('\n✅ Environment setup complete!');
  console.log('\n📚 Next steps:');
  console.log('  1. Edit your environment file(s) with actual values');
  console.log('  2. Start the development server: npm run start');
  console.log('  3. Check ENV_SETUP.md for detailed configuration guide');
  
  rl.close();
}

async function setupSingleEnvironment(env) {
  const envFile = path.join(projectRoot, `.env.${env}`);
  
  if (fs.existsSync(envFile)) {
    const overwrite = await question(`\n.env.${env} already exists. Overwrite? (y/N): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log(`⏭️  Skipping .env.${env}`);
      return;
    }
  }

  // Read template
  const template = fs.readFileSync(envExample, 'utf8');
  
  // Replace environment-specific values
  let content = template.replace(
    'EXPO_PUBLIC_ENVIRONMENT=development',
    `EXPO_PUBLIC_ENVIRONMENT=${env}`
  );

  // Set environment-specific defaults
  const defaults = {
    development: {
      API_URL: 'http://localhost:3000/api/v1',
      APP_NAME: 'StarTynk Dev',
      APP_SCHEME: 'startynk-dev',
      ENABLE_LOGS: 'true',
      ENABLE_ANALYTICS: 'false',
      ENABLE_CRASH_REPORTING: 'false'
    },
    staging: {
      API_URL: 'https://staging-api.startynk.com/api/v1',
      APP_NAME: 'StarTynk Staging',
      APP_SCHEME: 'startynk-staging', 
      ENABLE_LOGS: 'true',
      ENABLE_ANALYTICS: 'true',
      ENABLE_CRASH_REPORTING: 'true'
    },
    production: {
      API_URL: 'https://api.startynk.com/api/v1',
      APP_NAME: 'StarTynk',
      APP_SCHEME: 'startynk',
      ENABLE_LOGS: 'false',
      ENABLE_ANALYTICS: 'true',
      ENABLE_CRASH_REPORTING: 'true'
    }
  };

  const envDefaults = defaults[env];
  
  // Apply defaults
  Object.entries(envDefaults).forEach(([key, value]) => {
    const regex = new RegExp(`EXPO_PUBLIC_${key}=.*`, 'g');
    content = content.replace(regex, `EXPO_PUBLIC_${key}=${value}`);
  });

  // Write file
  fs.writeFileSync(envFile, content);
  console.log(`✅ Created .env.${env}`);
}

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n\n👋 Environment setup cancelled.');
  rl.close();
  process.exit(0);
});

// Run the setup
setupEnvironment().catch(error => {
  console.error('❌ Error during setup:', error.message);
  rl.close();
  process.exit(1);
});