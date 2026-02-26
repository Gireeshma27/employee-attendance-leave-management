const API_BASE_URL = 'http://localhost:5000/api/v1';

const testManagerUserAccess = async () => {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  TESTING MANAGER ACCESS TO USER ENDPOINTS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  try {
    // STEP 1: Login as Manager
    console.log('[ STEP 1 ] Manager Login');
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
    console.log(`   Email: manager@test.com`);
    console.log(`   Role: MANAGER`);
    console.log(`   Token: ${managerToken.substring(0, 30)}...\n`);

    // STEP 2: Manager accesses GET /users (without filters)
    console.log('[ STEP 2 ] Manager Accessing GET /users');
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
      console.log(`   Response Status: 200 OK`);
      console.log(`   Success: ${managerUsersData.success}`);
      console.log(`   Records returned: ${managerUsersData.data?.records?.length || 0}`);
      if (managerUsersData.data?.records?.length > 0) {
        console.log(`   Sample record: ${managerUsersData.data.records[0].name}\n`);
      } else {
        console.log('');
      }
    } else {
      const error = await managerUsersRes.json();
      console.log(`❌ Manager CANNOT access GET /users`);
      console.log(`   Response Status: ${managerUsersRes.status}`);
      console.log(`   Error: ${error.message}`);
      console.log(`   This indicates the fix did NOT work\n`);
      process.exit(1);
    }

    // STEP 3: Manager accesses GET /users?role=MANAGER (filtered)
    console.log('[ STEP 3 ] Manager Accessing GET /users?role=MANAGER');
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
      console.log(`   Response Status: 200 OK`);
      console.log(`   Success: ${managerFilterData.success}`);
      console.log(`   Manager records returned: ${managerFilterData.data?.records?.length || 0}\n`);
    } else {
      const error = await managerFilterRes.json();
      console.log(`❌ Manager CANNOT filter GET /users?role=MANAGER`);
      console.log(`   Response Status: ${managerFilterRes.status}`);
      console.log(`   Error: ${error.message}\n`);
      process.exit(1);
    }

    // STEP 4: Manager attempts GET /users/:id (specific user)
    console.log('[ STEP 4 ] Manager Accessing GET /users/:id (get specific user)');
    console.log('─────────────────────────────────────────────────────────────────');
    
    // Get first user ID from list
    const userListRes = await fetch(`${API_BASE_URL}/users?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`,
      },
    });

    const userListData = await userListRes.json();
    const firstUserId = userListData.data?.records?.[0]?._id;

    if (!firstUserId) {
      console.log('⚠️  Could not find a user to test with\n');
    } else {
      const userDetailRes = await fetch(`${API_BASE_URL}/users/${firstUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${managerToken}`,
        },
      });

      if (userDetailRes.status === 200) {
        const userDetailData = await userDetailRes.json();
        console.log(`✅ Manager CAN access GET /users/:id`);
        console.log(`   Response Status: 200 OK`);
        console.log(`   User: ${userDetailData.data?.name}\n`);
      } else {
        const error = await userDetailRes.json();
        console.log(`❌ Manager CANNOT access GET /users/:id`);
        console.log(`   Response Status: ${userDetailRes.status}`);
        console.log(`   Error: ${error.message}\n`);
        process.exit(1);
      }
    }

    // SUMMARY
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('  AUTHORIZATION FIX VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('✅ Manager READ access to GET /users: WORKING');
    console.log('✅ Manager can filter by role: WORKING');
    console.log('✅ Manager can get specific user: WORKING');
    console.log('\n✅ AUTHORIZATION FIX IS SUCCESSFUL');
    console.log('   Manager now has read access to user endpoints.');
    console.log('   Manager Attendance page can fetch team members.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    process.exit(1);
  }
};

testManagerUserAccess();
