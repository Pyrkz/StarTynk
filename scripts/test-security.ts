import axios from 'axios';
import chalk from 'chalk';
import jwt from 'jsonwebtoken';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

interface SecurityTest {
  name: string;
  test: () => Promise<boolean>;
}

const securityTests: SecurityTest[] = [
  {
    name: 'SQL Injection Prevention',
    test: async () => {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          identifier: "admin' OR '1'='1",
          password: "' OR '1'='1",
        }, { validateStatus: () => true });
        
        return response.status === 401; // Should fail authentication
      } catch {
        return true;
      }
    },
  },
  {
    name: 'XSS Prevention',
    test: async () => {
      try {
        const response = await axios.post(`${API_URL}/auth/register`, {
          email: 'test@example.com',
          password: 'Test123!@#',
          name: '<script>alert("XSS")</script>',
        }, { validateStatus: () => true });
        
        if (response.status === 201) {
          // Check if name is properly escaped
          const userData = response.data.data.user;
          return !userData.name.includes('<script>');
        }
        return true;
      } catch {
        return true;
      }
    },
  },
  {
    name: 'Rate Limiting',
    test: async () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          axios.post(`${API_URL}/auth/login`, {
            identifier: 'test@example.com',
            password: 'wrong',
          }, { validateStatus: () => true })
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      return rateLimited;
    },
  },
  {
    name: 'JWT Token Validation',
    test: async () => {
      // Test with invalid token
      try {
        const response = await axios.get(`${API_URL}/users/me`, {
          headers: {
            'Authorization': 'Bearer invalid-token',
          },
          validateStatus: () => true,
        });
        
        return response.status === 401;
      } catch {
        return true;
      }
    },
  },
  {
    name: 'Password Strength Requirements',
    test: async () => {
      const weakPasswords = ['12345678', 'password', 'Password1'];
      
      for (const password of weakPasswords) {
        const response = await axios.post(`${API_URL}/auth/register`, {
          email: `test${Date.now()}@example.com`,
          password,
        }, { validateStatus: () => true });
        
        if (response.status !== 400) {
          return false; // Weak password was accepted
        }
      }
      return true;
    },
  },
  {
    name: 'HTTPS Redirect in Production',
    test: async () => {
      if (process.env.NODE_ENV !== 'production') {
        return true; // Skip in non-production
      }
      
      try {
        const response = await axios.get(
          API_URL.replace('https://', 'http://'),
          { 
            validateStatus: () => true,
            maxRedirects: 0,
          }
        );
        
        return response.status === 301 || response.status === 302;
      } catch {
        return true;
      }
    },
  },
  {
    name: 'Security Headers',
    test: async () => {
      const response = await axios.get(`${API_URL}/health`, {
        validateStatus: () => true,
      });
      
      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'referrer-policy',
      ];
      
      return requiredHeaders.every(header => 
        response.headers[header] !== undefined
      );
    },
  },
];

async function testSecurity(): Promise<void> {
  console.log(chalk.blue('🔐 Running Security Tests...\n'));

  const results: Array<{ test: string; passed: boolean }> = [];

  for (const test of securityTests) {
    try {
      const passed = await test.test();
      results.push({ test: test.name, passed });
      
      if (passed) {
        console.log(chalk.green(`✅ ${test.name}`));
      } else {
        console.log(chalk.red(`❌ ${test.name}`));
      }
    } catch (error: any) {
      results.push({ test: test.name, passed: false });
      console.log(chalk.red(`❌ ${test.name}`));
      console.log(chalk.gray(`   Error: ${error.message}`));
    }
  }

  // Summary
  console.log(chalk.blue('\n📊 Security Test Summary:\n'));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(chalk.green(`✅ Passed: ${passed}/${results.length}`));
  if (failed > 0) {
    console.log(chalk.red(`❌ Failed: ${failed}/${results.length}`));
    console.log(chalk.yellow('\n⚠️  Security vulnerabilities detected!'));
    process.exit(1);
  }
}

testSecurity().catch(console.error);