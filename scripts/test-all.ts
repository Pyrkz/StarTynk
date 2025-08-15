import { spawn } from 'child_process';
import chalk from 'chalk';

interface TestSuite {
  name: string;
  command: string;
  critical: boolean;
}

const testSuites: TestSuite[] = [
  {
    name: 'Type Checking',
    command: 'pnpm test:types',
    critical: true,
  },
  {
    name: 'Unit Tests',
    command: 'pnpm test:unit',
    critical: true,
  },
  {
    name: 'Integration Tests',
    command: 'pnpm test:integration',
    critical: true,
  },
  {
    name: 'CORS Tests',
    command: 'pnpm test:cors',
    critical: true,
  },
  {
    name: 'Security Tests',
    command: 'pnpm test:security',
    critical: true,
  },
  {
    name: 'E2E Tests',
    command: 'pnpm test:e2e',
    critical: false,
  },
  {
    name: 'Performance Tests',
    command: 'pnpm test:performance',
    critical: false,
  },
];

async function runTest(suite: TestSuite): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(chalk.blue(`\n🧪 Running ${suite.name}...\n`));
    
    const child = spawn(suite.command, {
      shell: true,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`✅ ${suite.name} passed`));
        resolve(true);
      } else {
        console.log(chalk.red(`❌ ${suite.name} failed`));
        resolve(false);
      }
    });
  });
}

async function runAllTests(): Promise<void> {
  console.log(chalk.blue('🚀 Starting Complete Test Suite\n'));
  console.log(chalk.gray('This may take several minutes...\n'));

  const results: Array<{ name: string; passed: boolean; critical: boolean }> = [];

  for (const suite of testSuites) {
    const passed = await runTest(suite);
    results.push({
      name: suite.name,
      passed,
      critical: suite.critical,
    });

    if (!passed && suite.critical) {
      console.log(chalk.red('\n⛔ Critical test failed. Stopping test suite.'));
      break;
    }
  }

  // Summary
  console.log(chalk.blue('\n📊 Test Suite Summary:\n'));
  
  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);
  const criticalFailed = failed.filter(r => r.critical);

  console.log(chalk.green(`✅ Passed: ${passed.length}/${results.length}`));
  
  if (failed.length > 0) {
    console.log(chalk.red(`❌ Failed: ${failed.length}/${results.length}`));
    
    if (criticalFailed.length > 0) {
      console.log(chalk.red(`\n⛔ Critical failures: ${criticalFailed.map(r => r.name).join(', ')}`));
    }
    
    process.exit(1);
  } else {
    console.log(chalk.green('\n🎉 All tests passed!'));
  }
}

runAllTests().catch(console.error);