import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import User from '../src/models/user.model.js';
import { hashPassword } from '../src/utils/password.js';

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (adminExists) {
      console.log('✓ Admin user already exists');
      console.log(`Email: admin@example.com`);
      console.log(`Password: admin123`);
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      employeeId: 'ADMIN001',
      isActive: true,
      department: 'Administration',
      phone: '9876543210'
    });

    console.log('✓ Admin user created successfully!');
    console.log('\n--- Admin Credentials ---');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: admin123`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Employee ID: ${adminUser.employeeId}`);
    console.log('\n⚠️  Change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();
