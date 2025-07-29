const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAuth() {
  console.log('🧪 Testing Authentication API...\n');

  try {
    // Test 1: Login with default admin credentials
    console.log('1️⃣ Testing login with admin/admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth`, {
      username: 'admin',
      password: 'admin'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    console.log('');

    // Test 2: Try to login with wrong password
    console.log('2️⃣ Testing login with wrong password...');
    try {
      await axios.post(`${API_BASE_URL}/auth`, {
        username: 'admin',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected wrong password');
        console.log('Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 3: Try to login with non-existent user
    console.log('3️⃣ Testing login with non-existent user...');
    try {
      await axios.post(`${API_BASE_URL}/auth`, {
        username: 'nonexistent',
        password: 'password'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected non-existent user');
        console.log('Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 4: Test change password (if login was successful)
    console.log('4️⃣ Testing change password...');
    try {
      const changePasswordResponse = await axios.post(`${API_BASE_URL}/auth/change-password`, {
        username: 'admin',
        oldPassword: 'admin',
        newPassword: 'newpassword123'
      });
      
      console.log('✅ Password changed successfully!');
      console.log('Response:', JSON.stringify(changePasswordResponse.data, null, 2));
      console.log('');

      // Test 5: Try to login with new password
      console.log('5️⃣ Testing login with new password...');
      const newLoginResponse = await axios.post(`${API_BASE_URL}/auth`, {
        username: 'admin',
        password: 'newpassword123'
      });
      
      console.log('✅ Login with new password successful!');
      console.log('Response:', JSON.stringify(newLoginResponse.data, null, 2));
      console.log('');

      // Test 6: Change password back to admin
      console.log('6️⃣ Changing password back to admin...');
      await axios.post(`${API_BASE_URL}/auth/change-password`, {
        username: 'admin',
        oldPassword: 'newpassword123',
        newPassword: 'admin'
      });
      
      console.log('✅ Password changed back to admin!');
      console.log('');

    } catch (error) {
      console.log('❌ Change password test failed:', error.response?.data?.error || error.message);
    }

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