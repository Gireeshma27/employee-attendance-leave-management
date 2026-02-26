import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/user.js';

const findAdminUser = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Looking for admin users...\n');

    const admins = await User.find({ role: 'ADMIN' }).select('email isActive name').lean();
    
    if (admins.length > 0) {
      console.log('Admin Users Found:');
      admins.forEach((admin, i) => {
        console.log(`${i + 1}. Email: ${admin.email} | Active: ${admin.isActive} | Name: ${admin.name}`);
      });
      console.log(`\nFirst admin email: ${admins[0].email}`);
    } else {
      console.log('No admin users found in database.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

findAdminUser();
