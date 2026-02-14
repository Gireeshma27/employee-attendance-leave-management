const API_BASE_URL = 'http://localhost:5000/api/v1';

const testLogin = async () => {
  try {
    console.log('🔍 Testing manager@test.com login...\n');
    console.log(`POST ${API_BASE_URL}/auth/login`);
    console.log('Body:', JSON.stringify({
      email: 'manager@test.com',
      password: 'Manager@123'
    }, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'manager@test.com',
        password: 'Manager@123',
      }),
    });

    console.log('\n--- Response ---');
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    const data = await response.json();
    
    console.log('\nResponse JSON:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ LOGIN SUCCESSFUL');
    } else {
      console.log('\n❌ LOGIN FAILED');
      console.log(`Message: ${data.message}`);
      if (data.data) {
        console.log('Error Details:', data.data);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testLogin();
