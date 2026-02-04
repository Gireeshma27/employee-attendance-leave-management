import mongoose from "mongoose";

/**
 * @description Pure User Schema definition.
 * @module models/usermodel
 */

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
  },
  {
    timestamps: true,
    versionKey: false, // Cleaner response
  },
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });

const User = mongoose.model("User", userSchema);

export default User;
