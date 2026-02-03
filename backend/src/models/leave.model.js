import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide a user ID"],
    },
    leaveType: {
      type: String,
      enum: ["CL", "SL", "PL", "UL"],
      required: [true, "Please provide a leave type"],
    },
    fromDate: {
      type: Date,
      required: [true, "Please provide a start date"],
    },
    toDate: {
      type: Date,
      required: [true, "Please provide an end date"],
    },
    numberOfDays: {
      type: Number,
      required: [true, "Please provide number of days"],
    },
    reason: {
      type: String,
      required: [true, "Please provide a reason"],
      maxlength: [1000, "Reason cannot be more than 1000 characters"],
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
      maxlength: [500, "Rejection reason cannot be more than 500 characters"],
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.version = `${(ret.__v || 0) + 1}.0`;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        ret.version = `${(ret.__v || 0) + 1}.0`;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Index for performance
leaveSchema.index({ userId: 1, status: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ userId: 1, createdAt: -1 });

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
