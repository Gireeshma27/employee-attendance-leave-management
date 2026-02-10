import mongoose from 'mongoose';
import env from './src/config/env.js';
import Leave from './src/models/leave.js';
import User from './src/models/user.js';

async function createTestLeaves() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const employees = await User.find({ role: 'EMPLOYEE' });
    if (employees.length === 0) {
      console.log('No employees found. Please create employees first.');
      process.exit(1);
    }

    const managers = await User.find({ role: 'MANAGER' });
    const manager = managers[0];

    const testLeaves = [
      {
        employee: employees[0]._id,
        leaveType: 'Casual',
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-02-11'),
        reason: 'Family function',
        status: 'Pending',
        managerApproved: false,
      },
      {
        employee: employees[1] ? employees[1]._id : employees[0]._id,
        leaveType: 'Sick',
        startDate: new Date('2026-02-12'),
        endDate: new Date('2026-02-12'),
        reason: 'Medical checkup',
        status: 'Pending',
        managerApproved: true, // Manager approved, should show to admin
      },
      {
        employee: employees[2] ? employees[2]._id : employees[0]._id,
        leaveType: 'Paid',
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-02-16'),
        reason: 'Vacation',
        status: 'Approved',
        managerApproved: true,
      },
    ];

    for (const leaveData of testLeaves) {
      const leave = new Leave(leaveData);
      await leave.save();
      console.log(`Created leave: ${leave._id} for employee ${leave.employee} - Status: ${leave.status}, ManagerApproved: ${leave.managerApproved}`);
    }

    console.log('Test leaves created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test leaves:', error);
    process.exit(1);
  }
}

createTestLeaves();