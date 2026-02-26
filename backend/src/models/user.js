import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "EMPLOYEE"],
      default: "EMPLOYEE",
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    department: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
    },
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    timingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timing",
    },
    wfhAllowed: {
      type: Boolean,
      default: false,
    },
    totalWFHDays: {
      type: Number,
      default: 5,
    },
    usedWFHDays: {
      type: Number,
      default: 0,
    },
    wfhDaysRemaining: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
    versionKey: false, // Cleaner response
  },
);

// Pre-save hook to recalculate wfhDaysRemaining based on totalWFHDays - usedWFHDays
userSchema.pre("save", function(next) {
  // Calculate remaining WFH days
  if (this.totalWFHDays !== undefined && this.usedWFHDays !== undefined) {
    this.wfhDaysRemaining = Math.max(0, this.totalWFHDays - this.usedWFHDays);
  }
  next();
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });

const User = mongoose.model("User", userSchema);

export default User;
