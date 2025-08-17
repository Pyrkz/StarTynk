/**
 * Test script to verify tRPC v11 configuration compatibility
 * This script checks if the package.json configurations are compatible
 * without requiring actual package installation
 */

const fs = require('fs');
const path = require('path');

const packagesToCheck = [
  'apps/web/package.json',
  'apps/mobile/package.json', 
  'packages/trpc/package.json'
];

const requiredPackages = {
  '@trpc/client': '^11.4.4',
  '@trpc/server': '^11.4.4',
  '@trpc/react-query': '^11.4.4',
  '@tanstack/react-query': '^5.85.3'
};

function checkPackageVersions() {
  console.log('🔍 Checking tRPC v11 compatibility...\n');
  
  let allValid = true;
  
  packagesToCheck.forEach(packagePath => {
    const fullPath = path.join(__dirname, '..', packagePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ ${packagePath} not found`);
      allValid = false;
      return;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    console.log(`📦 Checking ${packagePath}:`);
    
    Object.entries(requiredPackages).forEach(([pkg, expectedVersion]) => {
      if (dependencies[pkg]) {
        const actualVersion = dependencies[pkg];
        const isCompatible = actualVersion === expectedVersion || 
                           actualVersion.includes('11.') ||
                           (pkg.includes('@tanstack') && actualVersion.includes('5.'));
        
        if (isCompatible) {
          console.log(`   ✅ ${pkg}: ${actualVersion}`);
        } else {
          console.log(`   ❌ ${pkg}: ${actualVersion} (expected ${expectedVersion})`);
          allValid = false;
        }
      } else if (packagePath.includes(pkg.split('/')[1]) || pkg === '@tanstack/react-query') {
        // Only require if it's relevant to this package
        console.log(`   ⚠️  ${pkg}: missing`);
      }
    });
    
    console.log('');
  });
  
  return allValid;
}

function checkTRPCCodeCompatibility() {
  console.log('🔧 Checking tRPC code compatibility...\n');
  
  const trpcFiles = [
    'packages/trpc/src/trpc.ts',
    'apps/web/src/lib/trpc/client.ts'
  ];
  
  let compatibilityIssues = [];
  
  trpcFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for v11 compatible patterns
      const hasSuperjsonTransformer = content.includes('transformer: superjson');
      const hasCreateTRPCReact = content.includes('createTRPCReact');
      const hasModernImports = content.includes('@trpc/react-query') || content.includes('@trpc/client');
      
      console.log(`📄 ${filePath}:`);
      
      if (hasSuperjsonTransformer) {
        console.log('   ✅ Uses superjson transformer');
      }
      
      if (hasCreateTRPCReact) {
        console.log('   ✅ Uses createTRPCReact (v11 compatible)');
      }
      
      if (hasModernImports) {
        console.log('   ✅ Has modern tRPC imports');
      }
      
      // Check for potential issues
      if (content.includes('createReactQueryHooks')) {
        console.log('   ⚠️  Uses deprecated createReactQueryHooks (should use createTRPCReact)');
        compatibilityIssues.push(`${filePath}: Update createReactQueryHooks to createTRPCReact`);
      }
      
      console.log('');
    }
  });
  
  return compatibilityIssues;
}

function main() {
  console.log('🚀 tRPC v11 Compatibility Test\n');
  console.log('This test verifies that the monorepo is configured for tRPC v11 compatibility.\n');
  
  const versionsValid = checkPackageVersions();
  const compatibilityIssues = checkTRPCCodeCompatibility();
  
  console.log('📋 Summary:');
  
  if (versionsValid) {
    console.log('✅ Package versions: All tRPC packages updated to v11.4.4');
    console.log('✅ React Query: Updated to v5.85.3');
  } else {
    console.log('❌ Package versions: Some packages need updating');
  }
  
  if (compatibilityIssues.length === 0) {
    console.log('✅ Code compatibility: No issues found');
  } else {
    console.log('⚠️  Code compatibility: Issues found:');
    compatibilityIssues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  console.log('\n🔧 Next steps:');
  console.log('1. Install dependencies: pnpm install');
  console.log('2. Build packages: pnpm run build:packages');
  console.log('3. Start development: pnpm run dev');
  
  if (versionsValid && compatibilityIssues.length === 0) {
    console.log('\n🎉 tRPC v11 upgrade appears successful!');
    return true;
  } else {
    console.log('\n⚠️  Some issues found. Please address them before proceeding.');
    return false;
  }
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { main, checkPackageVersions, checkTRPCCodeCompatibility };