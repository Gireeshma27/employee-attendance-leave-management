import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import User from '../src/models/user.model.js';

const checkUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✓ Connected to MongoDB\n');

        // Get all users
        const users = await User.find({}).select('name email role isActive');

        console.log('=== All Users in Database ===\n');

        if (users.length === 0) {
            console.log('No users found in database.');
        } else {
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   isActive: ${user.isActive}`);
                console.log('');
            });
        }

        // Count summary
        const activeCount = users.filter(u => u.isActive).length;
        const inactiveCount = users.filter(u => !u.isActive).length;
        console.log(`--- Summary ---`);
        console.log(`Total: ${users.length}, Active: ${activeCount}, Inactive: ${inactiveCount}`);

        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
};

checkUsers();
