import mongoose from 'mongoose';
import env from './src/config/env.js';
import User from './src/models/user.js';

async function checkUsers() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const users = await User.find({});
    console.log('Total users:', users.length);
    users.forEach(user => {
      console.log(`ID: ${user._id}, Name: ${user.name}, Role: ${user.role}, EmployeeId: ${user.employeeId}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();