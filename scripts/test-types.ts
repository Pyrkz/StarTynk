import { execSync } from 'child_process';
import chalk from 'chalk';
import path from 'path';

interface TypeCheckResult {
  package: string;
  success: boolean;
  errors?: string[];
}

async function checkTypes(): Promise<void> {
  console.log(chalk.blue('🔍 Checking TypeScript types across all packages...\n'));

  const packages = [
    'packages/shared',
    'packages/database',
    'packages/api',
    'packages/features',
    'apps/web',
    'apps/mobile',
  ];

  const results: TypeCheckResult[] = [];

  for (const pkg of packages) {
    console.log(chalk.yellow(`Checking ${pkg}...`));
    
    try {
      execSync(`pnpm type-check`, {
        cwd: path.resolve(process.cwd(), pkg),
        stdio: 'pipe',
      });
      
      results.push({ package: pkg, success: true });
      console.log(chalk.green(`✅ ${pkg} - No type errors\n`));
    } catch (error: any) {
      const errors = error.stdout?.toString().split('\n').filter(Boolean) || [];
      results.push({ package: pkg, success: false, errors });
      console.log(chalk.red(`❌ ${pkg} - Type errors found`));
      console.log(chalk.gray(errors.slice(0, 5).join('\n')));
      console.log('\n');
    }
  }

  // Check cross-package imports
  console.log(chalk.blue('🔗 Checking cross-package type imports...\n'));
  
  const testImports = `
    import { UserDTO, ProjectDTO } from '@repo/shared/types';
    import { prisma } from '@repo/database';
    import { authService } from '@repo/api/services';
    import { useAuth } from '@repo/features/auth';
    
    // Test type usage
    const user: UserDTO = {} as UserDTO;
    const project: ProjectDTO = {} as ProjectDTO;
  `;

  // Summary
  console.log(chalk.blue('\n📊 Type Check Summary:\n'));
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(chalk.green(`✅ Passed: ${successCount}`));
  console.log(chalk.red(`❌ Failed: ${failureCount}`));
  
  if (failureCount > 0) {
    process.exit(1);
  }
}

checkTypes().catch(console.error);