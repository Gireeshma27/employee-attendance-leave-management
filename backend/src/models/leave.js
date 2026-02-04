import mongoose from "mongoose";

/**
 * @description Pure Leave Schema definition.
 * @module models/leavemodel
 */

const leaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaveType: {
      type: String,
      enum: ["CL", "SL", "PL", "UL"],
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    numberOfDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: {
      type: String,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes
leaveSchema.index({ userId: 1, status: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ userId: 1, createdAt: -1 });

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
