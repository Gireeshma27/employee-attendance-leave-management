import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/user.js';
import Leave from '../src/models/leave.js';

const checkLeaves = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✓ Connected to MongoDB\n');

        // Get all users
        const users = await User.find({ role: 'EMPLOYEE' }).select('name email employeeId');

        console.log('=== Employee Leave Status ===\n');

        for (const user of users) {
            console.log(`Employee: ${user.name} (${user.employeeId})`);
            console.log(`Email: ${user.email}`);

            // Get leaves for this user
            const leaves = await Leave.find({ employee: user._id })
                .sort({ createdAt: -1 })
                .populate('approvedBy', 'name');

            if (leaves.length === 0) {
                console.log('  No leave applications found.');
            } else {
                console.log(`  Leave Applications (${leaves.length}):`);
                leaves.forEach((leave, index) => {
                    console.log(`    ${index + 1}. Type: ${leave.leaveType}`);
                    console.log(`       Dates: ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()}`);
                    console.log(`       Status: ${leave.status}`);
                    console.log(`       Reason: ${leave.reason}`);
                    if (leave.approvedBy) {
                        console.log(`       Approved by: ${leave.approvedBy.name}`);
                    }
                    if (leave.rejectionReason) {
                        console.log(`       Rejection reason: ${leave.rejectionReason}`);
                    }
                    console.log(`       Applied: ${leave.createdAt.toDateString()}`);
                    console.log('');
                });
            }
            console.log('---');
        }

        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
};

checkLeaves();