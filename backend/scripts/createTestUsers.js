import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/user.js';
import { hashPassword } from '../src/utils/password.js';

const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Admin User
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      const hashedPassword = await hashPassword('admin123');
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        employeeId: 'ADMIN001',
        isActive: true,
        department: 'Administration',
        phone: '9876543210'
      });
      console.log('✓ Admin user created');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Manager User (with requested credentials)
    const managerExists = await User.findOne({ email: 'manager@test.com' });
    if (!managerExists) {
      const hashedPassword = await hashPassword('Manager@123');
      await User.create({
        name: 'Test Manager',
        email: 'manager@test.com',
        password: hashedPassword,
        role: 'MANAGER',
        employeeId: 'MGR001',
        isActive: true,
        department: 'Engineering',
        phone: '9876543211'
      });
      console.log('✓ Manager user created (manager@test.com)');
    } else {
      console.log('✓ Manager user already exists');
    }

    // Employee User
    const employeeExists = await User.findOne({ email: 'employee@example.com' });
    if (!employeeExists) {
      const hashedPassword = await hashPassword('employee123');
      await User.create({
        name: 'Employee User',
        email: 'employee@example.com',
        password: hashedPassword,
        role: 'EMPLOYEE',
        employeeId: 'EMP001',
        isActive: true,
        department: 'Engineering',
        phone: '9876543212'
      });
      console.log('✓ Employee user created');
    } else {
      console.log('✓ Employee user already exists');
    }

    console.log('\n--- Test Users Created ---');
    console.log('\nAdmin:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123\n');
    
    console.log('Manager (For Test):');
    console.log('  Email: manager@test.com');
    console.log('  Password: Manager@123\n');
    
    console.log('Employee:');
    console.log('  Email: employee@example.com');
    console.log('  Password: employee123\n');

    console.log('⚠️  Change passwords after first login!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating test users:', error.message);
    process.exit(1);
  }
};

createTestUsers();
