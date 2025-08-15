import axios from 'axios';
import chalk from 'chalk';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

interface CorsTest {
  name: string;
  origin: string;
  method: string;
  endpoint: string;
  expectedStatus: number;
  shouldHaveCors: boolean;
}

const corsTests: CorsTest[] = [
  {
    name: 'Mobile app origin - Development',
    origin: 'http://localhost:8081',
    method: 'OPTIONS',
    endpoint: '/health',
    expectedStatus: 204,
    shouldHaveCors: true,
  },
  {
    name: 'Mobile app origin - Network IP',
    origin: 'http://192.168.1.100:8081',
    method: 'OPTIONS',
    endpoint: '/health',
    expectedStatus: 204,
    shouldHaveCors: true,
  },
  {
    name: 'Web app origin - Same origin',
    origin: 'http://localhost:3000',
    method: 'GET',
    endpoint: '/health',
    expectedStatus: 200,
    shouldHaveCors: false,
  },
  {
    name: 'Unknown origin - Should be blocked',
    origin: 'http://malicious-site.com',
    method: 'POST',
    endpoint: '/auth/login',
    expectedStatus: 403,
    shouldHaveCors: false,
  },
  {
    name: 'Preflight request with auth headers',
    origin: 'http://localhost:8081',
    method: 'OPTIONS',
    endpoint: '/users',
    expectedStatus: 204,
    shouldHaveCors: true,
  },
];

async function testCors(): Promise<void> {
  console.log(chalk.blue('🔒 Testing CORS Configuration...\n'));

  const results: Array<{ test: string; passed: boolean; error?: string }> = [];

  for (const test of corsTests) {
    try {
      const response = await axios({
        method: test.method,
        url: `${API_URL}${test.endpoint}`,
        headers: {
          'Origin': test.origin,
          'Access-Control-Request-Method': test.method === 'OPTIONS' ? 'POST' : undefined,
          'Access-Control-Request-Headers': test.method === 'OPTIONS' ? 'content-type,authorization' : undefined,
        },
        validateStatus: () => true,
      });

      const hasCorsHeaders = !!(
        response.headers['access-control-allow-origin'] ||
        response.headers['access-control-allow-methods']
      );

      const passed = 
        response.status === test.expectedStatus &&
        hasCorsHeaders === test.shouldHaveCors;

      results.push({
        test: test.name,
        passed,
        error: passed ? undefined : `Expected status ${test.expectedStatus}, got ${response.status}`,
      });

      if (passed) {
        console.log(chalk.green(`✅ ${test.name}`));
      } else {
        console.log(chalk.red(`❌ ${test.name}`));
        console.log(chalk.gray(`   ${results[results.length - 1].error}`));
      }

      // Log CORS headers if present
      if (hasCorsHeaders) {
        console.log(chalk.gray(`   CORS: ${response.headers['access-control-allow-origin']}`));
      }
    } catch (error: any) {
      results.push({
        test: test.name,
        passed: false,
        error: error.message,
      });
      console.log(chalk.red(`❌ ${test.name}`));
      console.log(chalk.gray(`   Error: ${error.message}`));
    }
  }

  // Summary
  console.log(chalk.blue('\n📊 CORS Test Summary:\n'));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(chalk.green(`✅ Passed: ${passed}/${results.length}`));
  if (failed > 0) {
    console.log(chalk.red(`❌ Failed: ${failed}/${results.length}`));
    process.exit(1);
  }
}

testCors().catch(console.error);