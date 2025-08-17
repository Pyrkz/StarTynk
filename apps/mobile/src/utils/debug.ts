// Debug helper for API connection issues

export const testApiConnection = async () => {
  console.log('Testing API connection...');
  
  try {
    // Test 1: Basic connection
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    console.log('✅ Health check passed:', data);
    
    // Test 2: Auth endpoint
    const authTest = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'test@test.com',
        password: 'test'
      })
    });
    
    console.log('Auth endpoint status:', authTest.status);
    const authResponse = await authTest.text();
    console.log('Auth response:', authResponse);
    
  } catch (error) {
    console.error('❌ API Connection Error:', error);
    console.error('Make sure backend is running on http://localhost:3000');
  }
};

// Call this in your app to debug
// testApiConnection();