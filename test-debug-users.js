const fetch = require('node-fetch');

async function testDebugUsers() {
  try {
    console.log('Testing debug users endpoint...');
    
    const response = await fetch('http://localhost:3000/api/debug/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Debug endpoint working correctly');
      console.log(`Database type: ${data.databaseType}`);
      console.log(`Total users: ${data.totalUsers}`);
      if (data.users && data.users.length > 0) {
        console.log('Users found:');
        data.users.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.username} (${user.account_name})`);
        });
      }
    } else {
      console.log('❌ Debug endpoint failed');
    }
    
  } catch (error) {
    console.error('Error testing debug endpoint:', error.message);
  }
}

testDebugUsers();