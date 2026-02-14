import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/user.js';
import { hashPassword } from '../src/utils/password.js';

const checkAndCreateManager = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if manager@test.com already exists
    const managerExists = await User.findOne({ email: 'manager@test.com' });
    
    if (managerExists) {
      console.log('✓ Manager user already exists with email: manager@test.com');
      console.log('\n--- Manager Credentials ---');
      console.log(`Email: ${managerExists.email}`);
      console.log(`Role: ${managerExists.role}`);
      console.log(`Employee ID: ${managerExists.employeeId}`);
      console.log(`Status: ${managerExists.isActive ? 'Active' : 'Inactive'}`);
      console.log('\n✓ Ready to login with: manager@test.com / Manager@123');
    } else {
      // Create new manager with requested credentials
      console.log('Creating new manager user...');
      const hashedPassword = await hashPassword('Manager@123');
      
      const manager = await User.create({
        name: 'Test Manager',
        email: 'manager@test.com',
        password: hashedPassword,
        role: 'MANAGER',
        employeeId: 'MGR_TEST_001',
        isActive: true,
        department: 'Engineering',
        phone: '9876543211'
      });

      console.log('✓ Manager user created successfully!');
      console.log('\n--- Manager Credentials ---');
      console.log(`Email: ${manager.email}`);
      console.log(`Password: Manager@123`);
      console.log(`Role: ${manager.role}`);
      console.log(`Employee ID: ${manager.employeeId}`);
      console.log(`Status: Active`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

checkAndCreateManager();
