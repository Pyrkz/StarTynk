import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
}

async function testEndpoint(
  endpoint: string,
  method: string,
  data?: any,
  headers?: Record<string, string>
): Promise<TestResult> {
  try {
    const response = await axios({
      method,
      url: `${API_BASE}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    
    return {
      endpoint,
      method,
      status: response.status,
      success: response.status >= 200 && response.status < 300,
    };
  } catch (error: any) {
    return {
      endpoint,
      method,
      status: error.response?.status || 0,
      success: false,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log('🧪 Testing unified endpoints...\n');
  
  const tests = [
    // Test unified login with web client
    {
      endpoint: '/v1/auth/unified-login',
      method: 'POST',
      data: {
        identifier: 'test@example.com',
        password: 'testpassword',
        loginMethod: 'email',
      },
      headers: { 'X-Client-Type': 'web' },
    },
    
    // Test unified login with mobile client
    {
      endpoint: '/v1/auth/unified-login',
      method: 'POST',
      data: {
        identifier: 'test@example.com',
        password: 'testpassword',
        loginMethod: 'email',
        deviceId: 'test-device-123',
      },
      headers: { 'X-Client-Type': 'mobile' },
    },
    
    // Test mobile redirect endpoint
    {
      endpoint: '/mobile/v1/auth/login',
      method: 'POST',
      data: {
        identifier: '+1234567890',
        password: 'testpassword',
        loginMethod: 'phone',
      },
      headers: { 'X-Client-Type': 'mobile' },
    },
    
    // Test unified register
    {
      endpoint: '/v1/auth/unified-register',
      method: 'POST',
      data: {
        email: 'newuser@example.com',
        password: 'newpassword123',
        name: 'New User',
        loginMethod: 'email',
      },
      headers: { 'X-Client-Type': 'web' },
    },
  ];
  
  for (const test of tests) {
    const result = await testEndpoint(
      test.endpoint,
      test.method,
      test.data,
      test.headers
    );
    
    console.log(`${result.success ? '✅' : '❌'} ${test.method} ${test.endpoint}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Client: ${test.headers?.['X-Client-Type'] || 'unknown'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}