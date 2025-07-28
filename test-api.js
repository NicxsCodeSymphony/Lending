

const API_BASE_URL = 'http://localhost:3000/api'; 

// Test data
const testCustomer = {
  first_name: "John",
  middle_name: "Doe",
  last_name: "Smith",
  contact: "1234567890",
  address: "123 Main St",
  birthdate: "1990-01-01"
};

const testUpdateData = {
  first_name: "Jane",
  contact: "0987654321"
};

// Helper function to make API calls
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(result, null, 2));
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test all endpoints
async function runTests() {
  console.log('🚀 Starting API Tests...\n');

  // Test 1: GET all customers
  await testAPI('/customers');

  // Test 2: POST create new customer
  const createResult = await testAPI('/customers', 'POST', testCustomer);
  
  if (createResult.success && createResult.data.customer_id) {
    const customerId = createResult.data.customer_id;
    
    // Test 3: GET specific customer
    await testAPI(`/customers/${customerId}`);
    
    // Test 4: PUT update customer
    await testAPI(`/customers/${customerId}`, 'PUT', testUpdateData);
    
    // Test 5: GET updated customer
    await testAPI(`/customers/${customerId}`);
    
    // Test 6: DELETE customer (optional - uncomment if you want to test delete)
    // await testAPI(`/customers/${customerId}`, 'DELETE');
  }

  console.log('\n🎉 API Tests Completed!');
}

// Run the tests
runTests().catch(console.error);