const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAuth() {
  console.log('🧪 Testing Authentication...\n');

  try {
    // First, check what users exist
    console.log('1️⃣ Checking users in database...');
    try {
      const debugResponse = await axios.get(`${API_BASE_URL}/debug/users`);
      console.log('Database info:', debugResponse.data);
    } catch (error) {
      console.log('Debug endpoint not available or error:', error.message);
    }
    console.log('');

    // Test login
    console.log('2️⃣ Testing login with admin/admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth`, {
      username: 'admin',
      password: 'admin'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

// Run the test
testAuth();