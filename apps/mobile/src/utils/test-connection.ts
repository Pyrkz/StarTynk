// Test połączenia z API dla różnych środowisk

export const testConnection = async () => {
  const endpoints = [
    'http://localhost:3000/health',
    'http://10.0.2.2:3000/health',
    'http://192.168.1.31:3000/health',
  ];

  console.log('Testing API connections...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting: ${endpoint}`);
      const response = await fetch(endpoint, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      const data = await response.json();
      console.log(`✅ SUCCESS: ${endpoint}`, data);
    } catch (error) {
      console.log(`❌ FAILED: ${endpoint}`, error.message);
    }
  }
};