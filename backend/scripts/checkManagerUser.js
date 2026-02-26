import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/user.js';
import bcryptjs from 'bcryptjs';

const checkManager = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Check all users
    console.log('--- ALL USERS IN DATABASE ---');
    const allUsers = await User.find().select('email role isActive name').lean();
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach((u, i) => {
      console.log(`${i + 1}. Email: ${u.email} | Role: ${u.role} | Active: ${u.isActive} | Name: ${u.name}`);
    });

    // Check manager specifically
    console.log('\n--- CHECKING manager@test.com ---');
    const manager = await User.findOne({ email: 'manager@test.com' }).select('+password');
    
    if (!manager) {
      console.log('❌ manager@test.com NOT FOUND in database');
    } else {
      console.log('✓ manager@test.com FOUND');
      console.log(`  Email: ${manager.email}`);
      console.log(`  Role: ${manager.role}`);
      console.log(`  Active: ${manager.isActive}`);
      console.log(`  Name: ${manager.name}`);
      console.log(`  Password Hash: ${manager.password.substring(0, 30)}...`);
      
      // Test password comparison
      console.log('\n--- TESTING PASSWORD COMPARISON ---');
      console.log('Testing password: Manager@123');
      const isMatch = await bcryptjs.compare('Manager@123', manager.password);
      console.log(`Password matches: ${isMatch}`);
      
      if (isMatch) {
        console.log('✓ Password is CORRECT - authentication should work');
      } else {
        console.log('❌ Password is WRONG - possible issue with password creation or storage');
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkManager();
