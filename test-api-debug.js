// Debug test script for your NextJS API endpoints
// Run this with: node test-api-debug.js

const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to make API calls with detailed debugging
async function testAPI(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`\n🧪 Testing ${method} ${endpoint}`);
    console.log(`📍 URL: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
    
    // Get response text first
    const responseText = await response.text();
    console.log(`📄 Raw Response:`, responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(responseText);
      console.log(`✅ Parsed JSON:`, JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.log(`❌ Not valid JSON: ${parseError.message}`);
      result = { error: 'Not JSON', raw: responseText };
    }
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test all endpoints
async function runTests() {
  console.log('🚀 Starting API Debug Tests...\n');
  console.log('Make sure your development server is running: npm run dev\n');

  // Test 1: GET all customers
  await testAPI('/customers');

  console.log('\n🎉 Debug Tests Completed!');
  console.log('\n💡 If you see HTML instead of JSON, your server might not be running.');
  console.log('💡 Run: npm run dev');
}

// Run the tests
runTests().catch(console.error);