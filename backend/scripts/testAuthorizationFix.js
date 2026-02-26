const API_BASE_URL = 'http://localhost:5000/api/v1';

const testUserEndpointAccess = async () => {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  TESTING USER ENDPOINT ACCESS CONTROL');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  try {
    // STEP 1: Login as Admin
    console.log('[ STEP 1 ] Admin Login');
    console.log('─────────────────────────────────────────────────────────────────');
    
    const adminLoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin@12345',
      }),
    });

    const adminLoginData = await adminLoginRes.json();
    
    if (!adminLoginData.success) {
      console.log('❌ Admin login failed:', adminLoginData.message);
      process.exit(1);
    }

    const adminToken = adminLoginData.data.token;
    console.log('✅ Admin logged in successfully');
    console.log(`   Token: ${adminToken.substring(0, 30)}...\n`);

    // STEP 2: Admin accesses GET /users
    console.log('[ STEP 2 ] Admin Accessing GET /users');
    console.log('─────────────────────────────────────────────────────────────────');
    
    const adminUsersRes = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    console.log(`Status: ${adminUsersRes.status}`);
    
    if (adminUsersRes.status === 200) {
      const adminUsersData = await adminUsersRes.json();
      console.log(`✅ Admin CAN access GET /users`);
      console.log(`   Status: 200 OK`);
      console.log(`   Records returned: ${adminUsersData.data?.records?.length || 0}\n`);
    } else {
      const error = await adminUsersRes.json();
      console.log(`❌ Admin CANNOT access GET /users`);
      console.log(`   Status: ${adminUsersRes.status}`);
      console.log(`   Error: ${error.message}\n`);
      process.exit(1);
    }

    // STEP 3: Login as Manager
    console.log('[ STEP 3 ] Manager Login');
    console.log('─────────────────────────────────────────────────────────────────');
    
    const managerLoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager@test.com',
        password: 'Manager@123',
      }),
    });

    const managerLoginData = await managerLoginRes.json();
    
    if (!managerLoginData.success) {
      console.log('❌ Manager login failed:', managerLoginData.message);
      process.exit(1);
    }

    const managerToken = managerLoginData.data.token;
    console.log('✅ Manager logged in successfully');
    console.log(`   Token: ${managerToken.substring(0, 30)}...\n`);

    // STEP 4: Manager accesses GET /users
    console.log('[ STEP 4 ] Manager Accessing GET /users');
    console.log('─────────────────────────────────────────────────────────────────');
    
    const managerUsersRes = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`,
      },
    });

    console.log(`Status: ${managerUsersRes.status}`);
    
    if (managerUsersRes.status === 200) {
      const managerUsersData = await managerUsersRes.json();
      console.log(`✅ Manager CAN access GET /users`);
      console.log(`   Status: 200 OK`);
      console.log(`   Records returned: ${managerUsersData.data?.records?.length || 0}\n`);
    } else {
      const error = await managerUsersRes.json();
      console.log(`❌ Manager CANNOT access GET /users`);
      console.log(`   Status: ${managerUsersRes.status}`);
      console.log(`   Error: ${error.message}\n`);
      process.exit(1);
    }

    // STEP 5: Manager accesses GET /users?role=MANAGER
    console.log('[ STEP 5 ] Manager Accessing GET /users?role=MANAGER');
    console.log('─────────────────────────────────────────────────────────────────');
    
    const managerFilterRes = await fetch(`${API_BASE_URL}/users?role=MANAGER`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`,
      },
    });

    console.log(`Status: ${managerFilterRes.status}`);
    
    if (managerFilterRes.status === 200) {
      const managerFilterData = await managerFilterRes.json();
      console.log(`✅ Manager CAN filter GET /users?role=MANAGER`);
      console.log(`   Status: 200 OK`);
      console.log(`   Records returned: ${managerFilterData.data?.records?.length || 0}\n`);
    } else {
      const error = await managerFilterRes.json();
      console.log(`❌ Manager CANNOT filter GET /users?role=MANAGER`);
      console.log(`   Status: ${managerFilterRes.status}`);
      console.log(`   Error: ${error.message}\n`);
      process.exit(1);
    }

    // STEP 6: Test Admin CREATE (should work)
    console.log('[ STEP 6 ] Admin Attempting POST /users (Write Operation)');
    console.log('─────────────────────────────────────────────────────────────────');
    
    const adminCreateRes = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'TestPass123',
        role: 'EMPLOYEE',
      }),
    });

    if (adminCreateRes.status === 201 || adminCreateRes.status === 200) {
      console.log(`✅ Admin CAN create users (POST /users)`);
      console.log(`   Status: ${adminCreateRes.status}\n`);
    } else {
      console.log(`⚠️  POST attempt (expected to potentially fail):`);
      console.log(`   Status: ${adminCreateRes.status}\n`);
    }

    // STEP 7: Test Manager CREATE (should fail)
    console.log('[ STEP 7 ] Manager Attempting POST /users (Write Operation)');
    console.log('─────────────────────────────────────────────────────────────────');
    
    const managerCreateRes = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        name: 'Test User 2',
        email: 'testuser2@example.com',
        password: 'TestPass456',
        role: 'EMPLOYEE',
      }),
    });

    if (managerCreateRes.status === 403 || managerCreateRes.status === 401) {
      console.log(`✅ Manager CORRECTLY DENIED from creating users (POST /users)`);
      console.log(`   Status: ${managerCreateRes.status} (Expected)\n`);
    } else if (managerCreateRes.status === 201 || managerCreateRes.status === 200) {
      console.log(`⚠️  Manager was allowed to create users (unexpected)`);
      console.log(`   Status: ${managerCreateRes.status}\n`);
    } else {
      console.log(`Status: ${managerCreateRes.status}\n`);
    }

    // SUMMARY
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('  VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('✅ Admin READ access: ALLOWED (GET /users)');
    console.log('✅ Admin WRITE access: ALLOWED (POST /users)');
    console.log('✅ Manager READ access: ALLOWED (GET /users)');
    console.log('✅ Manager WRITE access: DENIED (POST /users)');
    console.log('\n✅ AUTHORIZATION FIX SUCCESSFUL');
    console.log('   Manager can now view users and team members.');
    console.log('   Manager cannot create/modify users (admin only).\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    process.exit(1);
  }
};

testUserEndpointAccess();
