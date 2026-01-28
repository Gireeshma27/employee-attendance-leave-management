import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide a date'],
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    workingHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half-day', 'WFH', 'Leave'],
      default: 'Absent',
    },
    remarks: {
      type: String,
      maxlength: [500, 'Remarks cannot be more than 500 characters'],
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ date: 1 });

// Compound index for efficient queries
attendanceSchema.index({ userId: 1, date: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
