import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import User from '../src/models/user.model.js';

const activateAllAdmins = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✓ Connected to MongoDB\n');

        // First, show all users
        const allUsers = await User.find({}).select('name email role isActive');
        console.log('=== All Users Before Update ===\n');
        allUsers.forEach((user, index) => {
            const status = user.isActive ? '✓ Active' : '✗ Inactive';
            console.log(`${index + 1}. [${user.role}] ${user.email} - ${status}`);
        });
        console.log('');

        // Activate ALL users with ADMIN role
        const result = await User.updateMany(
            { role: 'ADMIN' },
            { isActive: true }
        );

        console.log(`\n✓ Activated ${result.modifiedCount} admin user(s)\n`);

        // Also activate any user that might be trying to login
        const allResult = await User.updateMany(
            {},
            { isActive: true }
        );

        console.log(`✓ Activated ALL users: ${allResult.modifiedCount} user(s) updated\n`);

        // Show all users after update
        const updatedUsers = await User.find({}).select('name email role isActive');
        console.log('=== All Users After Update ===\n');
        updatedUsers.forEach((user, index) => {
            const status = user.isActive ? '✓ Active' : '✗ Inactive';
            console.log(`${index + 1}. [${user.role}] ${user.email} - ${status}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
};

activateAllAdmins();
