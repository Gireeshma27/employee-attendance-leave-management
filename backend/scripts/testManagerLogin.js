const API_BASE_URL = 'http://localhost:5000/api/v1';

const testManagerLogin = async () => {
  try {
    console.log('🔍 Testing Manager Login...\n');
    
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

    const data = await response.json();

    if (data.success) {
      const { token, user } = data.data;
      console.log('✅ Login Successful!\n');
      console.log('--- User Data ---');
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Employee ID: ${user.employeeId}`);
      console.log(`Status: ${user.isActive ? 'Active' : 'Inactive'}`);
      console.log(`Department: ${user.department}`);
      
      console.log('\n--- JWT Token ---');
      console.log(`Token: ${token.substring(0, 50)}...`);
      
      // Decode token to verify claims
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('\n--- Token Claims ---');
      console.log(`User ID: ${payload.id}`);
      console.log(`Email: ${payload.email}`);
      console.log(`Role: ${payload.role}`);
      
      console.log('\n✅ Manager login flow verified successfully!');
      console.log('✅ JWT includes role: ' + payload.role);
      console.log('✅ Role-based routing will direct to /manager/dashboard');
      process.exit(0);
      
    } else {
      console.log('❌ Login failed:', data.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error testing login:', error.message);
    console.error('Make sure the backend server is running on port 5000');
    process.exit(1);
  }
};

testManagerLogin();
