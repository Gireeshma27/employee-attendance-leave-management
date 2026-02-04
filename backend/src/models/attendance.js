import mongoose from "mongoose";

/**
 * @description Pure Attendance Schema definition.
 * @module models/attendancemodel
 */

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
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
    workingMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Half-day", "WFH", "Leave"],
      default: "Absent",
    },
    remarks: {
      type: String,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes
attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ userId: 1, date: -1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
