import autocannon from 'autocannon';
import chalk from 'chalk';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

interface PerformanceTest {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  body?: any;
  duration: number;
  connections: number;
  pipelining: number;
  threshold: {
    avgLatency: number; // ms
    minThroughput: number; // req/sec
    maxErrors: number; // percentage
  };
}

const performanceTests: PerformanceTest[] = [
  {
    name: 'Health Check Endpoint',
    url: `${API_URL}/health`,
    method: 'GET',
    duration: 10,
    connections: 10,
    pipelining: 1,
    threshold: {
      avgLatency: 50,
      minThroughput: 1000,
      maxErrors: 1,
    },
  },
  {
    name: 'Login Endpoint',
    url: `${API_URL}/auth/login`,
    method: 'POST',
    body: JSON.stringify({
      identifier: 'perf@example.com',
      password: 'Test123!@#',
    }),
    duration: 10,
    connections: 10,
    pipelining: 1,
    threshold: {
      avgLatency: 200,
      minThroughput: 100,
      maxErrors: 5,
    },
  },
  {
    name: 'User List Endpoint',
    url: `${API_URL}/users?page=1&limit=20`,
    method: 'GET',
    duration: 10,
    connections: 10,
    pipelining: 1,
    threshold: {
      avgLatency: 150,
      minThroughput: 200,
      maxErrors: 2,
    },
  },
];

async function runPerformanceTests(): Promise<void> {
  console.log(chalk.blue('⚡ Running Performance Tests...\n'));

  for (const test of performanceTests) {
    console.log(chalk.yellow(`Testing: ${test.name}`));
    
    const result = await autocannon({
      url: test.url,
      method: test.method,
      body: test.body,
      headers: {
        'Content-Type': 'application/json',
      },
      duration: test.duration,
      connections: test.connections,
      pipelining: test.pipelining,
    });

    const avgLatency = result.latency.mean;
    const throughput = result.throughput.mean / 1024; // req/sec
    const errorRate = (result.errors / result.requests.total) * 100;

    const passed = 
      avgLatency <= test.threshold.avgLatency &&
      throughput >= test.threshold.minThroughput &&
      errorRate <= test.threshold.maxErrors;

    console.log(chalk.gray(`  Avg Latency: ${avgLatency.toFixed(2)}ms (threshold: ${test.threshold.avgLatency}ms)`));
    console.log(chalk.gray(`  Throughput: ${throughput.toFixed(2)} req/sec (threshold: ${test.threshold.minThroughput} req/sec)`));
    console.log(chalk.gray(`  Error Rate: ${errorRate.toFixed(2)}% (threshold: ${test.threshold.maxErrors}%)`));
    
    if (passed) {
      console.log(chalk.green(`✅ Passed\n`));
    } else {
      console.log(chalk.red(`❌ Failed\n`));
    }
  }
}

runPerformanceTests().catch(console.error);